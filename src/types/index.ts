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
  votedFor: number
  votedAgainst: number
  abstain: number
  notVoted: number
}

export type VoteResult = 'PASSED' | 'REJECTED'
export type MajorityType = 'SIMPLE_MAJORITY' | 'THREE_FIFTHS_PRESENT' | 'THREE_FIFTHS_ALL' | 'ABSOLUTE_MAJORITY'

export interface Poll {
  ref: string
  name: string
  note: string | null
  voters: number
  votesCount: VotesCount
  result: VoteResult | null
  majorityType: MajorityType
}

export interface PollDetail extends Poll {
  votes: Vote[]
}

export type VoteChoice = 'VOTED_FOR' | 'VOTED_AGAINST' | 'ABSTAIN' | 'NOT_VOTED' | 'ABSENT'

export interface Vote {
  voted: VoteChoice
  councilMember: CouncilMemberRef
}

export interface CouncilMemberRef {
  ref: string
  name: string
  politician: PoliticianRef
}

export interface PoliticianRef {
  ref: string
  name: string
  titles: string | null
  picture: string | null
}

export interface CouncilMember {
  ref: string
  politician: Politician
  season: Season
  town: Town
  otherFunctions: string | null
  description: string | null
  clubMember: ClubMemberRef | null
}

export interface Politician {
  ref: string
  name: string
  titles: string | null
  picture: string | null
  email: string | null
  phone: string | null
  partyNominees: PartyNominee[]
  councilMembers: CouncilMemberSummary[]
}

export interface CouncilMemberSummary {
  ref: string
  season: Season
  clubMember: ClubMemberRef | null
}

export interface ClubMemberRef {
  club: { ref: string; name: string }
}

export interface PartyNominee {
  party: { ref: string; name: string }
  season?: Season
}

export interface Club {
  ref: string
  name: string
}

export interface Party {
  ref: string
  name: string
}