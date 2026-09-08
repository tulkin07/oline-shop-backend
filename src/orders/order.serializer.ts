import { Order, OrderItem, OrderStatusHistory, Prisma } from '@prisma/client';
import { toNumber } from '../common/utils/money';

type OrderFull = Order & {
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};

export function serializeOrder(order: OrderFull) {
  return {
    ...order,
    subtotal: toNumber(order.subtotal),
    discount: toNumber(order.discount),
    deliveryFee: toNumber(order.deliveryFee),
    total: toNumber(order.total),
    items: order.items.map((item) => ({
      ...item,
      price: toNumber(item.price),
      total: toNumber(item.total),
    })),
  };
}

export const orderInclude = {
  items: true,
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
} satisfies Prisma.OrderInclude;
