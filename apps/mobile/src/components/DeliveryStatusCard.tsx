import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Colors, Spacing } from '../theme/tokens';
import type { Delivery } from '../api/deliveries';

const STEPS = [
  { key: 'PENDING', label: 'Order confirmed' },
  { key: 'ASSIGNED', label: 'Partner assigned' },
  { key: 'PICKED_UP', label: 'Picked up from kitchen' },
  { key: 'OUT_FOR_DELIVERY', label: 'On the way' },
  { key: 'DELIVERED', label: 'Delivered' },
] as const;

/** Status-based delivery tracker (DELIVERY.md §9). */
export const DeliveryStatusCard: React.FC<{
  delivery: Pick<Delivery, 'status' | 'partnerName'>;
}> = ({ delivery }) => {
  if (delivery.status === 'FAILED') {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>DELIVERY</Text>
          <Badge label="Failed" variant="warning" />
        </View>
        <Text style={styles.note}>
          The delivery could not be completed. Our team will contact you regarding a refund or redelivery.
        </Text>
      </Card>
    );
  }

  if (delivery.status === 'CANCELLED') {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>DELIVERY</Text>
          <Badge label="Cancelled" variant="skipped" />
        </View>
        <Text style={styles.note}>This delivery was cancelled.</Text>
      </Card>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === delivery.status);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>DELIVERY</Text>
        {delivery.partnerName ? (
          <Text style={styles.partner}>Partner: {delivery.partnerName}</Text>
        ) : null}
      </View>
      <View style={styles.timeline}>
        {STEPS.map((step, index) => {
          const isDone = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <View key={step.key} style={styles.timelineRow}>
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.dot,
                    isDone && styles.dotDone,
                    isCurrent && styles.dotCurrent,
                  ]}
                />
                {!isLast ? <View style={[styles.line, isDone && styles.lineDone]} /> : null}
              </View>
              <View style={styles.textCol}>
                <Text
                  style={[
                    styles.stepLabel,
                    isDone && styles.stepLabelDone,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorderDark,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMutedDark,
    letterSpacing: 0.8,
  },
  partner: {
    fontSize: 12,
    color: Colors.textSecondaryDark,
    fontWeight: '500',
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 28,
  },
  indicatorCol: {
    width: 20,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginTop: 5,
  },
  dotDone: {
    backgroundColor: Colors.secondary,
  },
  dotCurrent: {
    backgroundColor: Colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  line: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  lineDone: {
    backgroundColor: Colors.secondary,
  },
  textCol: {
    flex: 1,
    paddingLeft: Spacing.sm,
    paddingBottom: Spacing.sm,
    justifyContent: 'flex-start',
  },
  stepLabel: {
    fontSize: 13,
    color: Colors.textMutedDark,
    lineHeight: 18,
  },
  stepLabelDone: {
    color: Colors.textSecondaryDark,
  },
  stepLabelCurrent: {
    color: Colors.textPrimaryDark,
    fontWeight: '600',
  },
  note: {
    fontSize: 13,
    color: Colors.textSecondaryDark,
    lineHeight: 18,
  },
});
