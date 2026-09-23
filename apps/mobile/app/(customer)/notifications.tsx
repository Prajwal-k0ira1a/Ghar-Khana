import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Typography } from '../../src/theme/tokens';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../src/hooks/useNotifications';

export default function NotificationsScreen() {
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Daily cutoff notices and fulfillment updates.</Text>
        </View>
        <TouchableOpacity
          onPress={() => markAllRead.mutate()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.markAllText}>Mark read</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} size="small" style={{ marginTop: Spacing.xl }} />
      ) : isError ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Unable to load notifications</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={styles.retryLink}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : !data || data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptyDesc}>Cutoff alerts and delivery notices will appear here.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {data.map((item, idx, arr) => {
            const isUnread = !item.readAt;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.6}
                onPress={() => {
                  if (isUnread) markRead.mutate(item.id);
                }}
                style={[
                  styles.notificationRow,
                  idx < arr.length - 1 && styles.notificationRowBorder,
                ]}
              >
                <View style={styles.rowTop}>
                  <Text style={[styles.itemTitle, isUnread && styles.itemTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemTime}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <Text style={styles.itemBody}>{item.body}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 4,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  markAllText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 4,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  notificationRow: {
    paddingVertical: Spacing.md,
  },
  notificationRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  itemTitle: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemTitleUnread: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  itemTime: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textMuted,
  },
  itemBody: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  emptyState: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.bodyBold,
    fontSize: 15,
    marginBottom: 4,
  },
  emptyDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  retryLink: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
});
