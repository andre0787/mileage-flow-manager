/**
 * P12.6-13 — Promotions Feature (RTK Query)
 *
 * Endpoints para promoções: CRUD, source registry, alertas.
 * Segue o padrão canônico do projeto (baseApi.injectEndpoints).
 */

import { baseApi } from "../api";
import type {
  Promotion,
  PromotionSource,
  PromotionAlert,
  SourceHealth,
  ConfidenceLevel,
  PromotionStatus,
} from "../../ai/mutation/promotion/types";
export { promotionsAdapter, promotionSelectors } from "./adapter";

// ─── Promotion Types ───────────────────────────────────────────

interface PromotionListResponse {
  data: Promotion[];
  total: number;
}

interface PromotionSourceListResponse {
  data: PromotionSource[];
  total: number;
}

interface PromotionAlertListResponse {
  data: PromotionAlert[];
  total: number;
}

// ─── Inject Endpoints ──────────────────────────────────────────

export const promotionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Promotions ──
    getPromotions: builder.query<
      PromotionListResponse,
      {
        program?: string;
        status?: PromotionStatus;
        confidence?: ConfidenceLevel;
        sort?: "recent" | "bonus" | "expiry";
      }
    >({
      query: (params) => ({
        url: "/promotions",
        params,
      }),
      providesTags: ["promotions"],
    }),

    getPromotionById: builder.query<Promotion, string>({
      query: (id) => `/promotions/${id}`,
      providesTags: (_result, _error, id) => [{ type: "promotions", id }],
    }),

    createPromotion: builder.mutation<Promotion, Partial<Promotion>>({
      query: (body) => ({
        url: "/promotions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["promotions"],
    }),

    updatePromotion: builder.mutation<Promotion, { id: string; data: Partial<Promotion> }>({
      query: ({ id, data }) => ({
        url: `/promotions/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "promotions", id }, "promotions"],
    }),

    deletePromotion: builder.mutation<void, string>({
      query: (id) => ({
        url: `/promotions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["promotions"],
    }),

    // ── Source Registry ──
    getPromotionSources: builder.query<PromotionSourceListResponse, void>({
      query: () => "/promotions/sources",
      providesTags: ["promotion_sources"],
    }),

    getSourceHealth: builder.query<SourceHealth, string>({
      query: (sourceId) => `/promotions/sources/${sourceId}/health`,
      providesTags: (_result, _error, sourceId) => [{ type: "promotion_sources", id: sourceId }],
    }),

    triggerCollection: builder.mutation<void, string>({
      query: (sourceId) => ({
        url: `/promotions/sources/${sourceId}/collect`,
        method: "POST",
      }),
      invalidatesTags: ["promotions", "promotion_sources"],
    }),

    // ── Alerts ──
    getPromotionAlerts: builder.query<
      PromotionAlertListResponse,
      {
        unacknowledged?: boolean;
        promotionId?: string;
      }
    >({
      query: (params) => ({
        url: "/promotions/alerts",
        params,
      }),
      providesTags: ["promotion_alerts"],
    }),

    acknowledgeAlert: builder.mutation<void, string>({
      query: (alertId) => ({
        url: `/promotions/alerts/${alertId}/acknowledge`,
        method: "PUT",
      }),
      invalidatesTags: ["promotion_alerts"],
    }),

    // ── Deduplication ──
    getDeduplicationGroups: builder.query<
      {
        groupId: string;
        canonicalPromotionId: string;
        sourcePromotionIds: string[];
        similarity: number;
      }[],
      void
    >({
      query: () => "/promotions/dedup-groups",
      providesTags: ["promotions"],
    }),
  }),
});

// ─── Export Hooks ──────────────────────────────────────────────

export const {
  useGetPromotionsQuery,
  useGetPromotionByIdQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
  useGetPromotionSourcesQuery,
  useGetSourceHealthQuery,
  useTriggerCollectionMutation,
  useGetPromotionAlertsQuery,
  useAcknowledgeAlertMutation,
  useGetDeduplicationGroupsQuery,
} = promotionsApi;

export default promotionsApi;
