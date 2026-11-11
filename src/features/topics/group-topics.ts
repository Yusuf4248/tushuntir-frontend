import type { MasteryTopic } from '@/api/types'

/** `number` is the topic's 1-based place in its subject, in book order. */
export type NumberedTopic = MasteryTopic & { number: number }
export type ChapterGroup = { chapter: string | null; topics: NumberedTopic[] }
export type SubjectGroup = { subject: string; chapters: ChapterGroup[]; count: number }

/**
 * Groups /me/mastery topics by subject, then chapter, keeping the API's book order.
 * The API only gives names (no ids), so names are the keys.
 */
export function groupTopics(topics: MasteryTopic[]): SubjectGroup[] {
  const subjects: SubjectGroup[] = []
  for (const topic of topics) {
    let subject = subjects.find((s) => s.subject === topic.subject)
    if (!subject) {
      subject = { subject: topic.subject, chapters: [], count: 0 }
      subjects.push(subject)
    }
    subject.count += 1
    const numbered = { ...topic, number: subject.count }
    const last = subject.chapters.at(-1)
    if (last && last.chapter === topic.chapter) last.topics.push(numbered)
    else subject.chapters.push({ chapter: topic.chapter, topics: [numbered] })
  }
  return subjects
}
