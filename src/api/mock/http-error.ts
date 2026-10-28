export class MockHttpError extends Error {
  constructor(
    public status: number,
    public body: Record<string, unknown> = {}
  ) {
    super(String(body.message ?? status))
  }
}
