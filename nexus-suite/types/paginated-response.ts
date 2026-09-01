export interface PaginatedResponse<T> {
  content: T[];
  pageNo: number;
  pageOffset: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
  numberOfElements: number;
  size: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
}
