import prisma from './db.js';

export async function createNotification(title, content, type = 'system', targetRole = null, senderId = null) {
  const notification = await prisma.notification.create({
    data: { title, content, type, targetRole, senderId },
  });

  const userWhere = {};
  if (targetRole === 'user') userWhere.role = 'user';
  else if (targetRole === 'admin') userWhere.role = 'admin';

  const users = await prisma.user.findMany({
    where: userWhere,
    select: { id: true },
  });

  if (users.length > 0) {
    await prisma.notificationRead.createMany({
      data: users.map(u => ({
        notificationId: notification.id,
        userId: u.id,
        isRead: false,
      })),
    });
  }

  return notification;
}

export async function sendToAll(title, content, type = 'system', senderId = null) {
  return createNotification(title, content, type, null, senderId);
}

export async function sendToRole(role, title, content, type = 'system', senderId = null) {
  return createNotification(title, content, type, role, senderId);
}

export async function getUserNotifications(userId, page = 1, limit = 20) {
  const [items, total] = await Promise.all([
    prisma.notificationRead.findMany({
      where: { userId },
      include: { notification: true },
      orderBy: { notification: { createdAt: 'desc' } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notificationRead.count({ where: { userId } }),
  ]);

  return {
    notifications: items.map(item => ({
      id: item.notification.id,
      readId: item.id,
      title: item.notification.title,
      content: item.notification.content,
      type: item.notification.type,
      isRead: item.isRead,
      readAt: item.readAt,
      createdAt: item.notification.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function markAsRead(notificationId, userId) {
  return prisma.notificationRead.upsert({
    where: {
      notificationId_userId: { notificationId, userId },
    },
    update: { isRead: true, readAt: new Date() },
    create: { notificationId, userId, isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead(userId) {
  return prisma.notificationRead.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function getUnreadCount(userId) {
  return prisma.notificationRead.count({
    where: { userId, isRead: false },
  });
}

export async function getNotificationHistory(page = 1, limit = 20) {
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      include: {
        _count: { select: { readStatus: true } },
        readStatus: {
          where: { isRead: true },
          _count: true,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count(),
  ]);

  return {
    notifications: notifications.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      type: n.type,
      targetRole: n.targetRole,
      createdAt: n.createdAt,
      totalRecipients: n._count.readStatus,
      readCount: n.readStatus.length,
      readRate: n._count.readStatus > 0 ? Math.round((n.readStatus.length / n._count.readStatus) * 100) : 0,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getNotificationStats() {
  const [total, today, thisWeek] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.notification.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return { total, today, thisWeek };
}
