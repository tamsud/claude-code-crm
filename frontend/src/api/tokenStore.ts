export const tokenStore = {
  token: null as string | null,
  setToken(t: string | null) {
    this.token = t
  },
}
