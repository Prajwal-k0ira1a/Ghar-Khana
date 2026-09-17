import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { customerLocations, serviceAreas } from '../../db/schema/index.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import type { CreateLocationInput } from '@gharkhana/validation';

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export class LocationService {
  async listLocations(customerId: string) {
    return db.query.customerLocations.findMany({
      where: eq(customerLocations.customerId, customerId),
      orderBy: (loc, { desc }) => [desc(loc.isDefault), desc(loc.createdAt)],
    });
  }

  async getLocationById(locationId: string, customerId: string) {
    const location = await db.query.customerLocations.findFirst({
      where: and(
        eq(customerLocations.id, locationId),
        eq(customerLocations.customerId, customerId)
      ),
    });

    if (!location) {
      throw new NotFoundError('Location not found', 'LOCATION_NOT_FOUND');
    }

    return location;
  }

  async createLocation(customerId: string, input: CreateLocationInput) {
    // If setting as default, unset other defaults
    if (input.isDefault) {
      await db
        .update(customerLocations)
        .set({ isDefault: false })
        .where(eq(customerLocations.customerId, customerId));
    }

    const [created] = await db
      .insert(customerLocations)
      .values({
        customerId,
        label: input.label,
        addressLine: input.addressLine,
        landmark: input.landmark,
        latitude: input.latitude ? input.latitude.toString() : null,
        longitude: input.longitude ? input.longitude.toString() : null,
        instructions: input.instructions,
        isDefault: input.isDefault ?? false,
      })
      .returning();

    return created;
  }

  async updateLocation(
    locationId: string,
    customerId: string,
    input: Partial<CreateLocationInput>
  ) {
    const existing = await this.getLocationById(locationId, customerId);

    if (input.isDefault) {
      await db
        .update(customerLocations)
        .set({ isDefault: false })
        .where(eq(customerLocations.customerId, customerId));
    }

    const [updated] = await db
      .update(customerLocations)
      .set({
        ...(input.label ? { label: input.label } : {}),
        ...(input.addressLine ? { addressLine: input.addressLine } : {}),
        ...(input.landmark !== undefined ? { landmark: input.landmark } : {}),
        ...(input.latitude !== undefined
          ? { latitude: input.latitude ? input.latitude.toString() : null }
          : {}),
        ...(input.longitude !== undefined
          ? { longitude: input.longitude ? input.longitude.toString() : null }
          : {}),
        ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(customerLocations.id, locationId), eq(customerLocations.customerId, customerId)))
      .returning();

    return updated || existing;
  }

  async deleteLocation(locationId: string, customerId: string) {
    await this.getLocationById(locationId, customerId);
    await db
      .delete(customerLocations)
      .where(and(eq(customerLocations.id, locationId), eq(customerLocations.customerId, customerId)));
  }

  async isLocationServiceableByProvider(
    locationId: string,
    providerId: string
  ): Promise<{ serviceable: boolean; matchedAreaLabel?: string; distanceMeters?: number }> {
    const location = await db.query.customerLocations.findFirst({
      where: eq(customerLocations.id, locationId),
    });

    if (!location) {
      return { serviceable: false };
    }

    // Load active provider service areas
    const areas = await db.query.serviceAreas.findMany({
      where: and(eq(serviceAreas.providerId, providerId), eq(serviceAreas.isActive, true)),
    });

    if (!areas || areas.length === 0) {
      return { serviceable: false };
    }

    // If location has no lat/lng, fallback to area match or default check
    if (!location.latitude || !location.longitude) {
      // If provider has active service area without strict coordinates, allow
      const fallback = areas.find((a) => !a.centerLat || !a.centerLng);
      return { serviceable: !!fallback, matchedAreaLabel: fallback?.label };
    }

    const locLat = parseFloat(location.latitude);
    const locLng = parseFloat(location.longitude);

    for (const area of areas) {
      if (area.centerLat && area.centerLng && area.radiusMeters) {
        const areaLat = parseFloat(area.centerLat);
        const areaLng = parseFloat(area.centerLng);
        const dist = calculateDistanceMeters(locLat, locLng, areaLat, areaLng);

        if (dist <= area.radiusMeters) {
          return {
            serviceable: true,
            matchedAreaLabel: area.label,
            distanceMeters: Math.round(dist),
          };
        }
      }
    }

    return { serviceable: false };
  }
}

export const locationService = new LocationService();
