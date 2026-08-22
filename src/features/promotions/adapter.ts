import { createEntityAdapter } from "@reduxjs/toolkit";
import type { Promotion } from "../../ai/mutation/promotion/types";

/** Normalização de promoções para cache RTK e seletores memoizados. */
export const promotionsAdapter = createEntityAdapter<Promotion>({
  sortComparer: (a, b) => a.title.localeCompare(b.title),
});

export const promotionSelectors = promotionsAdapter.getSelectors();
