export interface Town {
  ref: string
  name: string
  lastSyncDate: string | null
}

export interface Season {
  ref: string
  name: string
}

export interface VotesCount {
  absent: number
  for: number
  against: number
  abstain: number
  not: number
}

export type VoteResult = 'PASSED' | 'REJECTED'
export type MajorityType = 'SIMPLE_MAJORITY' | 'THREE_FIFTHS_PRESENT' | 'THREE_FIFTHS_ALL' | 'ABSOLUTE_MAJORITY'

export interface AgendaItemRef {
  ref: string
  name: string
  meeting?: {
    ref: string
    name: string
    date: string
  }
}

export interface Poll {
  ref: string
  name: string
  note: string | null
  voters: number
  votesCount: VotesCount
  result: VoteResult | null
  majorityType: MajorityType
  agendaItem?: AgendaItemRef
}

export interface VoteGroup {
  voters: CouncilMemberRef[]
  count: number
}

export interface VotesGrouped {
  for: VoteGroup
  against: VoteGroup
  not: VoteGroup
  abstain: VoteGroup
  absent: VoteGroup
}

export interface PollDetail extends Poll {
  votes: VotesGrouped
}

export interface CouncilMemberRef {
  ref: string
  name: string
  picture: string | null
}

export interface CouncilMember {
  ref: string
  name: string
  title: string | null
  picture: string | null
  email: string | null
  phone: string | null
  otherFunctions: string | null
  nominee: string[]
  club: ClubInfo | null
}

export interface ClubInfo {
  ref: string
  name: string
  season: string
  position: string
}

export interface Politician {
  name: string
  titles: string | null
  picture: string | null
  email: string | null
  phone: string | null
  partyNominees: string[]
  club: string | null
}
