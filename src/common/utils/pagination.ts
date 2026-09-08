import { PaginationQueryDto } from '../dto/pagination-query.dto';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function getPagination(query: PaginationQueryDto): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export function parseSortOrder(order?: string): 'asc' | 'desc' {
  return order?.toLowerCase() === 'asc' ? 'asc' : 'desc';
}
