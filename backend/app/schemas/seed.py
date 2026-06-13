from pydantic import BaseModel


class SeedCounts(BaseModel):
    accounts: int
    contacts: int
    leads: int
    opportunities: int
    activities: int
    emails: int


class SeedResponse(BaseModel):
    message: str
    seeded: SeedCounts
