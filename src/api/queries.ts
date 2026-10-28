import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { adminApi, rentalsApi, equipmentApi, questionnaireApi } from './endpoints'
import type { BlockUsersRequest, RentRequest } from './schemas'
import type { TableQuery } from '@/modules/data-table/table-query'

export const queryKeys = {
  me: ['me'] as const,
  equipment: {
    all: ['equipment'] as const,
    detail: (id: string) => ['equipment', id] as const,
  },
  rentals: ['rentals'] as const,
  admin: {
    users: ['admin', 'users'] as const,
    usersPage: (query: TableQuery) => ['admin', 'users', query] as const,
  },
}

export const useEquipmentListQuery = () =>
  useQuery({
    queryKey: queryKeys.equipment.all,
    queryFn: equipmentApi.list,
  })

export const useEquipmentQuery = (id: MaybeRefOrGetter<string>) =>
  useQuery({
    queryKey: computed(() => queryKeys.equipment.detail(toValue(id))),
    queryFn: () => equipmentApi.byId(toValue(id)),
  })

export const useRentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: RentRequest) => equipmentApi.rent(body),
    onSuccess: (_, { equipment_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me })
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.rentals })
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(equipment_id) })
    },
  })
}

export const useRentalsQuery = () =>
  useQuery({
    queryKey: queryKeys.rentals,
    queryFn: rentalsApi.get,
  })

export const useQuestionnaireMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => questionnaireApi.submit(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me }),
  })
}

export const useAdminUsersQuery = (query: MaybeRefOrGetter<TableQuery>) =>
  useQuery({
    queryKey: computed(() => queryKeys.admin.usersPage(toValue(query))),
    queryFn: () => adminApi.searchUsers(toValue(query)),
    // Пока грузится следующая страница, показываем текущую, а не скелетон
    placeholderData: keepPreviousData,
  })

export const useBlockUsersMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: BlockUsersRequest) => adminApi.blockUsers(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.users }),
  })
}
