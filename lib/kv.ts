export const getKV = async () => await Deno.openKv();

export const setValue = async (kv: Deno.Kv, key: string[], value: any) => {
  await kv.atomic()
    .check({ key, versionstamp: null }) // `null` versionstamps mean 'no value'
    .set(key, value)
    .commit();
}
