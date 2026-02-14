import api from './client'
import type { Town, Season, Poll, PollDetail, CouncilMember, Politician, MemberVote, SyncStatus } from '../types'

export async function fetchTowns(): Promise<Town[]> {
  const { data } = await api.get<Town[]>('/cities')
  return data
}

export async function fetchSeasons(city: string, institution: string): Promise<Season[]> {
  const { data } = await api.get<Season[]>(`/${city}/${institution}/seasons`)
  return data
}

export async function fetchPolls(
  city: string, institution: string, season: string,
  dateFrom?: string, dateTo?: string
): Promise<Poll[]> {
  const path = dateFrom && dateTo
    ? `/${city}/${institution}/${season}/polls/${dateFrom}/${dateTo}`
    : `/${city}/${institution}/${season}/polls`
  const { data } = await api.get<Poll[]>(path)
  return data
}

export async function fetchPoll(ref: string): Promise<PollDetail> {
  const { data } = await api.get<PollDetail>(`/polls/${ref}`)
  return data
}

export async function fetchMembers(city: string, institution: string, season: string): Promise<CouncilMember[]> {
  const { data } = await api.get<CouncilMember[]>(`/${city}/${institution}/${season}/members`)
  return data
}

export async function fetchMember(ref: string): Promise<CouncilMember> {
  const { data } = await api.get<CouncilMember>(`/members/${ref}`)
  return data
}

export async function fetchMemberVotes(ref: string): Promise<MemberVote[]> {
  const { data } = await api.get<MemberVote[]>(`/members/${ref}/votes`)
  return data
}

export async function fetchPartySwitchers(city: string): Promise<Politician[]> {
  const { data } = await api.get<Politician[]>(`/politicians/${city}/party-switchers`)
  return data
}

export async function fetchClubSwitchers(city: string): Promise<Politician[]> {
  const { data } = await api.get<Politician[]>(`/politicians/${city}/club-switchers`)
  return data
}

export async function addTown(ref: string, name: string, source: string = 'DM'): Promise<{ status: string; ref: string; name: string; source: string }> {
  const { data } = await api.post('/cities', { ref, name, source })
  return data
}

export async function fetchSyncStatus(): Promise<SyncStatus> {
  const { data } = await api.get<SyncStatus>('/sync/status')
  return data
}

export async function triggerSync(town?: string): Promise<{ status: string; message: string }> {
  const path = town ? `/sync/trigger/${town}` : '/sync/trigger'
  const { data } = await api.post<{ status: string; message: string }>(path)
  return data
}