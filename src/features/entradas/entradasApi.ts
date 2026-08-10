import { baseApi } from "@/features/api/baseApi";
import { getEntriesEndpoint } from "./getEntries";
import { addEntryEndpoint } from "./addEntry";
import { confirmEntryEndpoint } from "./confirmEntry";
import { updateEntryEndpoint } from "./updateEntry";
import { deleteEntryEndpoint } from "./deleteEntry";

export const entradasApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...getEntriesEndpoint(builder),
    ...addEntryEndpoint(builder),
    ...confirmEntryEndpoint(builder),
    ...updateEntryEndpoint(builder),
    ...deleteEntryEndpoint(builder),
  }),
});
