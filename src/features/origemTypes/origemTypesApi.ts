import { baseApi } from "@/features/api/baseApi";
import { getOrigemTypesEndpoint } from "./getOrigemTypes";
import { addOrigemTypeEndpoint } from "./addOrigemType";
import { updateOrigemTypeEndpoint } from "./updateOrigemType";
import { deleteOrigemTypeEndpoint } from "./deleteOrigemType";

export const origemTypesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...getOrigemTypesEndpoint(builder),
    ...addOrigemTypeEndpoint(builder),
    ...updateOrigemTypeEndpoint(builder),
    ...deleteOrigemTypeEndpoint(builder),
  }),
});
