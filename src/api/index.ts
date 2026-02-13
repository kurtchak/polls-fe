import api from './client'
import type { Town, Season, Poll, PollDetail, CouncilMember, Politician } from '../types'

export async function fetchTowns(): Promise<Town[]> {
  const { data } = await api.get<Town[]>('/cities')
  return data
}

export async function fetchSeasons(city: string, institution: string): Promise<Season[]> {
  const { data } = await api.get<Season[]>(`/${city}/${institution}/seasons`)
  return data
}

export async function fetchPolls(city: string, institution: string, season: string): Promise<Poll[]> {
  const { data } = await api.get<Poll[]>(`/${city}/${institution}/${season}/polls`)
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

export async function fetchPartySwitchers(city: string): Promise<Politician[]> {
  const { data } = await api.get<Politician[]>(`/politicians/${city}/party-switchers`)
  return data
}

export async function fetchClubSwitchers(city: string): Promise<Politician[]> {
  const { data } = await api.get<Politician[]>(`/politicians/${city}/club-switchers`)
  return data
}