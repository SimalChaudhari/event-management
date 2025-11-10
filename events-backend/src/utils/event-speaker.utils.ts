import { Event } from '../event/event.entity';
import { UserUtils } from './user.utils';

type SpeakerSlot = {
  sessionId?: string | null;
  sessionTitle?: string | null;
  sessionDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  trackId?: string | null;
  trackTitle?: string | null;
  source: 'programme' | 'event';
};

type SpeakerEntry = {
  info: any;
  slots: SpeakerSlot[];
  order: number;
};

export class EventSpeakerUtils {
  static buildSpeakerSchedule(
    event?: Partial<Event> & {
      eventSpeakers?: any[];
      programmeTracks?: any[];
    },
  ): any[] {
    if (!event) {
      return [];
    }

    const speakerMap = new Map<string, SpeakerEntry>();

    const ensureSpeakerEntry = (speaker: any): SpeakerEntry | undefined => {
      if (!speaker?.id) {
        return undefined;
      }

      const existing = speakerMap.get(speaker.id);
      if (existing) {
        existing.info = {
          ...existing.info,
          ...UserUtils.getBasicSpeakerInfo(speaker),
        };
        return existing;
      }

      const entry: SpeakerEntry = {
        info: UserUtils.getBasicSpeakerInfo(speaker),
        slots: [],
        order: speakerMap.size,
      };
      speakerMap.set(speaker.id, entry);
      return entry;
    };

    const addSlotIfMissing = (entry: SpeakerEntry, slot: SpeakerSlot) => {
      if (!slot.sessionId) {
        const duplicate = entry.slots.some(
          (existing) =>
            !existing.sessionId &&
            existing.startTime === slot.startTime &&
            existing.endTime === slot.endTime &&
            existing.source === slot.source,
        );
        if (!duplicate) {
          entry.slots.push(slot);
        }
        return;
      }

      const duplicate = entry.slots.some(
        (existing) => existing.sessionId === slot.sessionId,
      );
      if (!duplicate) {
        entry.slots.push(slot);
      }
    };

    const trackIdToEventId = new Map<string, string | undefined>();
    event.programmeTracks?.forEach((track: any) => {
      if (track?.id) {
        trackIdToEventId.set(track.id, track.eventId ?? event?.id);
      }
    });

    event.eventSpeakers?.forEach((eventSpeaker: any) => {
      const entry = ensureSpeakerEntry(eventSpeaker?.speaker);
      if (!entry) {
        return;
      }

      const matchedProgrammeSlot = entry.slots.find(
        (slot) =>
          slot.sessionId &&
          trackIdToEventId.get(slot.trackId ?? '') === eventSpeaker?.eventId &&
          (slot.startTime === eventSpeaker?.speakingStartTime ||
            slot.endTime === eventSpeaker?.speakingEndTime),
      );

      if (!matchedProgrammeSlot) {
        const updatedInfo = { ...entry.info };
        if (eventSpeaker?.speakingStartTime) {
          updatedInfo.speakingStartTime = eventSpeaker.speakingStartTime;
        }
        if (eventSpeaker?.speakingEndTime) {
          updatedInfo.speakingEndTime = eventSpeaker.speakingEndTime;
        }
        entry.info = updatedInfo;
      }
    });

    event.programmeTracks?.forEach((track: any) => {
      track?.sessions?.forEach((session: any) => {
        const normalisedDate =
          session?.sessionDate instanceof Date
            ? session.sessionDate.toISOString()
            : session?.sessionDate ?? null;

        session?.speakers?.forEach((speaker: any) => {
          const entry = ensureSpeakerEntry(speaker);
          if (!entry) {
            return;
          }

          addSlotIfMissing(entry, {
            sessionId: session?.id ?? null,
            sessionTitle: session?.title ?? null,
            sessionDate: normalisedDate,
            startTime: session?.startTime ?? null,
            endTime: session?.endTime ?? null,
            venue: session?.venue ?? null,
            trackId: track?.id ?? null,
            trackTitle: track?.title ?? null,
            source: 'programme',
          });
        });
      });
    });

    const sortSlots = (slots: SpeakerSlot[]) =>
      slots
        .slice()
        .sort((a, b) => {
          const aDate = a.sessionDate
            ? new Date(a.sessionDate).getTime()
            : Number.POSITIVE_INFINITY;
          const bDate = b.sessionDate
            ? new Date(b.sessionDate).getTime()
            : Number.POSITIVE_INFINITY;

          if (aDate !== bDate) {
            return aDate - bDate;
          }

          const aTime = a.startTime ?? '';
          const bTime = b.startTime ?? '';

          if (aTime && bTime) {
            return aTime.localeCompare(bTime);
          }

          if (aTime) {
            return -1;
          }

          if (bTime) {
            return 1;
          }

          return 0;
        });

    return Array.from(speakerMap.values())
      .sort((a, b) => a.order - b.order)
      .map(({ info, slots }) => {
        const sortedSlots = sortSlots(slots);

        const hasProgrammeSlots = sortedSlots.some(
          (slot) => slot.source === 'programme',
        );

        const filteredSlots = hasProgrammeSlots
          ? sortedSlots.filter((slot) => slot.source === 'programme')
          : sortedSlots;

        const primaryStartSlot = filteredSlots.find((slot) => slot.startTime);
        const primaryEndSlot = [...filteredSlots]
          .reverse()
          .find((slot) => slot.endTime);

        return {
          ...info,
          speakingStartTime:
            primaryStartSlot?.startTime ?? info.speakingStartTime ?? '',
          speakingEndTime:
            primaryEndSlot?.endTime ?? info.speakingEndTime ?? '',
          speakingSessions: filteredSlots,
        };
      });
  }
}

