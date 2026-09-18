import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  providers,
  serviceAreas,
  menus,
  menuItems,
  cutoffPolicies,
  providerVerificationDocuments,
} from '../../db/schema/index.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/AppError.js';
import { calculateDistanceMeters } from '../locations/location.service.js';
import type { MealType } from '@gharkhana/types';
import type {
  SubmitDocumentInput,
  UpdateProviderProfileInput,
  CreateServiceAreaInput,
  UpdateServiceAreaInput,
  UpdateCutoffPolicyInput,
} from '@gharkhana/validation';

export interface ProviderQueryOptions {
  lat?: number;
  lng?: number;
  mealType?: MealType;
  dietaryTag?: string;
  page?: number;
  pageSize?: number;
}

export class ProviderService {
  async listProviders(options: ProviderQueryOptions) {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const offset = (page - 1) * pageSize;

    // Base query: verified and active providers
    const allVerifiedProviders = await db.query.providers.findMany({
      where: and(
        eq(providers.verificationStatus, 'VERIFIED'),
        eq(providers.status, 'ACTIVE')
      ),
      with: {
        serviceAreas: {
          where: eq(serviceAreas.isActive, true),
        },
        menus: {
          where: eq(menus.status, 'PUBLISHED'),
          with: {
            items: {
              where: eq(menuItems.availability, true),
            },
          },
        },
      },
      orderBy: [desc(providers.rating), desc(providers.ratingCount)],
    });

    let mapped = allVerifiedProviders.map((p) => {
      let distanceMeters: number | null = null;
      let isServiceable = true;

      if (options.lat && options.lng && p.serviceAreas.length > 0) {
        let minDistance = Infinity;
        let serviceableFound = false;

        for (const area of p.serviceAreas) {
          if (area.centerLat && area.centerLng && area.radiusMeters) {
            const dist = calculateDistanceMeters(
              options.lat,
              options.lng,
              parseFloat(area.centerLat),
              parseFloat(area.centerLng)
            );
            if (dist < minDistance) {
              minDistance = dist;
            }
            if (dist <= area.radiusMeters) {
              serviceableFound = true;
            }
          }
        }

        if (minDistance !== Infinity) {
          distanceMeters = Math.round(minDistance);
          isServiceable = serviceableFound;
        }
      }

      // Collect available meal types from published menus
      const availableMealTypes = new Set<string>();
      const availableDietaryTags = new Set<string>();

      p.menus.forEach((m) => {
        m.items.forEach((it) => {
          availableMealTypes.add(it.mealType);
          if (Array.isArray(it.dietaryTags)) {
            it.dietaryTags.forEach((t) => availableDietaryTags.add(t));
          }
        });
      });

      return {
        id: p.id,
        displayName: p.displayName,
        description: p.description,
        providerType: p.providerType,
        rating: p.rating ? parseFloat(p.rating) : null,
        ratingCount: p.ratingCount,
        dailyCapacity: p.dailyCapacity,
        servesMealTypes: Array.from(availableMealTypes),
        dietaryTags: Array.from(availableDietaryTags),
        distanceMeters,
        distanceDisplay: distanceMeters ? `${(distanceMeters / 1000).toFixed(1)} km` : null,
        isServiceable,
        serviceAreaLabels: p.serviceAreas.map((a) => a.label),
      };
    });

    // Apply filters
    if (options.mealType) {
      mapped = mapped.filter((p) => p.servesMealTypes.includes(options.mealType!));
    }
    if (options.dietaryTag) {
      mapped = mapped.filter((p) => p.dietaryTags.includes(options.dietaryTag!));
    }

    // Sort by serviceability first, then distance or rating
    mapped.sort((a, b) => {
      if (a.isServiceable && !b.isServiceable) return -1;
      if (!a.isServiceable && b.isServiceable) return 1;
      if (a.distanceMeters && b.distanceMeters) {
        return a.distanceMeters - b.distanceMeters;
      }
      return (b.rating || 0) - (a.rating || 0);
    });

    const totalItems = mapped.length;
    const paginatedItems = mapped.slice(offset, offset + pageSize);

    return {
      items: paginatedItems,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      },
    };
  }

  async getProviderById(id: string) {
    const provider = await db.query.providers.findFirst({
      where: eq(providers.id, id),
      with: {
        serviceAreas: {
          where: eq(serviceAreas.isActive, true),
        },
        cutoffPolicies: true,
        menus: {
          where: eq(menus.status, 'PUBLISHED'),
          with: {
            items: {
              where: eq(menuItems.availability, true),
            },
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    return provider;
  }

  async getProviderByUserId(userId: string) {
    const provider = await db.query.providers.findFirst({
      where: eq(providers.userId, userId),
      with: {
        serviceAreas: true,
        cutoffPolicies: true,
        verificationDocuments: true,
        menus: {
          with: {
            items: true,
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundError('Provider profile not found for this user', 'PROVIDER_NOT_FOUND');
    }

    return provider;
  }

  private async ensureProviderOwner(providerId: string, userId: string) {
    const provider = await db.query.providers.findFirst({
      where: eq(providers.id, providerId),
    });
    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }
    if (provider.userId !== userId) {
      throw new ForbiddenError('You do not have permission to manage this provider', 'NOT_OWNER');
    }
    return provider;
  }

  async submitVerificationDocument(
    providerId: string,
    userId: string,
    input: SubmitDocumentInput
  ) {
    await this.ensureProviderOwner(providerId, userId);

    const [doc] = await db
      .insert(providerVerificationDocuments)
      .values({
        providerId,
        documentType: input.documentType,
        objectStorageKey: input.objectStorageKey,
        status: 'PENDING',
      })
      .returning();

    // If currently PENDING, transition provider status to IN_REVIEW
    await db
      .update(providers)
      .set({ verificationStatus: 'IN_REVIEW', updatedAt: new Date() })
      .where(and(eq(providers.id, providerId), eq(providers.verificationStatus, 'PENDING')));

    return doc;
  }

  async updateProfile(
    providerId: string,
    userId: string,
    input: UpdateProviderProfileInput
  ) {
    const provider = await this.ensureProviderOwner(providerId, userId);

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (input.displayName) updateData.displayName = input.displayName;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.dailyCapacity) {
      updateData.dailyCapacity = {
        ...provider.dailyCapacity,
        ...input.dailyCapacity,
      };
    }

    const [updated] = await db
      .update(providers)
      .set(updateData)
      .where(eq(providers.id, providerId))
      .returning();

    return updated;
  }

  async addServiceArea(
    providerId: string,
    userId: string,
    input: CreateServiceAreaInput
  ) {
    await this.ensureProviderOwner(providerId, userId);

    const [area] = await db
      .insert(serviceAreas)
      .values({
        providerId,
        label: input.label,
        centerLat: input.centerLat.toString(),
        centerLng: input.centerLng.toString(),
        radiusMeters: input.radiusMeters,
        isActive: input.isActive ?? true,
      })
      .returning();

    return area;
  }

  async updateServiceArea(
    providerId: string,
    userId: string,
    areaId: string,
    input: UpdateServiceAreaInput
  ) {
    await this.ensureProviderOwner(providerId, userId);

    const area = await db.query.serviceAreas.findFirst({
      where: and(eq(serviceAreas.id, areaId), eq(serviceAreas.providerId, providerId)),
    });

    if (!area) {
      throw new NotFoundError('Service area not found', 'SERVICE_AREA_NOT_FOUND');
    }

    const updateData: Record<string, any> = {};
    if (input.label) updateData.label = input.label;
    if (input.centerLat !== undefined) updateData.centerLat = input.centerLat.toString();
    if (input.centerLng !== undefined) updateData.centerLng = input.centerLng.toString();
    if (input.radiusMeters !== undefined) updateData.radiusMeters = input.radiusMeters;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const [updated] = await db
      .update(serviceAreas)
      .set(updateData)
      .where(eq(serviceAreas.id, areaId))
      .returning();

    return updated;
  }

  async deleteServiceArea(providerId: string, userId: string, areaId: string) {
    await this.ensureProviderOwner(providerId, userId);

    await db
      .delete(serviceAreas)
      .where(and(eq(serviceAreas.id, areaId), eq(serviceAreas.providerId, providerId)));

    return { success: true };
  }

  async updateCutoffPolicy(
    providerId: string,
    userId: string,
    input: UpdateCutoffPolicyInput
  ) {
    await this.ensureProviderOwner(providerId, userId);

    // Check if policy for this mealType (or catch-all if null) already exists
    const existing = await db.query.cutoffPolicies.findFirst({
      where: input.mealType
        ? and(eq(cutoffPolicies.providerId, providerId), eq(cutoffPolicies.mealType, input.mealType))
        : and(eq(cutoffPolicies.providerId, providerId)),
    });

    if (existing) {
      const [updated] = await db
        .update(cutoffPolicies)
        .set({
          cutoffOffsetHours: input.cutoffOffsetHours,
          cutoffTimeOfDay: input.cutoffTimeOfDay,
          timezone: input.timezone || 'Asia/Kathmandu',
        })
        .where(eq(cutoffPolicies.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(cutoffPolicies)
      .values({
        providerId,
        mealType: input.mealType || null,
        cutoffOffsetHours: input.cutoffOffsetHours,
        cutoffTimeOfDay: input.cutoffTimeOfDay,
        timezone: input.timezone || 'Asia/Kathmandu',
      })
      .returning();

    return created;
  }
}

export const providerService = new ProviderService();
