import prisma from './db.js';

export async function createTicket(userId, category, title, initialMessage) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.create({
      data: {
        userId,
        category,
        title,
        status: 'open',
        priority: 'normal',
      },
    });

    if (initialMessage) {
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: userId,
          senderType: 'user',
          content: initialMessage,
        },
      });
    }

    return tx.ticket.findUnique({
      where: { id: ticket.id },
      include: { messages: true, user: { select: { id: true, nickname: true, email: true } } },
    });
  });
}

export async function getUserTickets(userId, page = 1, limit = 20, status = null) {
  const where = { userId };
  if (status) where.status = status;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return { tickets, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTicketDetail(ticketId, userId = null, isAdmin = false) {
  const where = { id: ticketId };
  if (!isAdmin && userId) where.userId = userId;

  const ticket = await prisma.ticket.findUnique({
    where,
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      user: { select: { id: true, nickname: true, email: true, avatar: true } },
    },
  });

  if (!ticket) return null;

  if (!isAdmin && userId) {
    await prisma.ticketMessage.updateMany({
      where: { ticketId, senderType: 'admin', isRead: false },
      data: { isRead: true },
    });
  } else if (isAdmin) {
    await prisma.ticketMessage.updateMany({
      where: { ticketId, senderType: 'user', isRead: false },
      data: { isRead: true },
    });
  }

  return ticket;
}

export async function addMessage(ticketId, senderId, senderType, content, attachments = null) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('工单不存在');

  if (ticket.status === 'closed') throw new Error('工单已关闭，无法发送消息');

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId,
      senderId,
      senderType,
      content,
      attachments: attachments ? JSON.stringify(attachments) : null,
    },
  });

  if (senderType === 'admin' && ticket.status === 'open') {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'in_progress' },
    });
  }

  return message;
}

export async function updateTicketStatus(ticketId, status, userId = null, isAdmin = false) {
  const where = { id: ticketId };
  if (!isAdmin && userId) where.userId = userId;

  const ticket = await prisma.ticket.findUnique({ where });
  if (!ticket) throw new Error('工单不存在');

  const updateData = { status };
  if (status === 'closed') updateData.closedAt = new Date();
  if (status === 'in_progress' && !ticket.assignedTo && isAdmin) updateData.assignedTo = userId;

  return prisma.ticket.update({
    where: { id: ticketId },
    data: updateData,
  });
}

export async function assignTicket(ticketId, adminId) {
  return prisma.ticket.update({
    where: { id: ticketId },
    data: { assignedTo: adminId, status: 'in_progress' },
  });
}

export async function getAllTickets(page = 1, limit = 20, filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.priority) where.priority = filters.priority;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { user: { nickname: { contains: filters.search } } },
      { user: { email: { contains: filters.search } } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        user: { select: { id: true, nickname: true, email: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return { tickets, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTicketStats() {
  const [open, inProgress, resolved, closed, total] = await Promise.all([
    prisma.ticket.count({ where: { status: 'open' } }),
    prisma.ticket.count({ where: { status: 'in_progress' } }),
    prisma.ticket.count({ where: { status: 'resolved' } }),
    prisma.ticket.count({ where: { status: 'closed' } }),
    prisma.ticket.count(),
  ]);

  return { open, inProgress, resolved, closed, total };
}

export async function getUnreadCount(userId) {
  const tickets = await prisma.ticket.findMany({
    where: { userId },
    select: { id: true },
  });

  if (tickets.length === 0) return 0;

  return prisma.ticketMessage.count({
    where: {
      ticketId: { in: tickets.map(t => t.id) },
      senderType: 'admin',
      isRead: false,
    },
  });
}
