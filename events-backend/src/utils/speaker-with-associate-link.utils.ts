import { Repository } from 'typeorm';
import { ProgrammeSession } from '../programme/programme-session.entity';
import { ProgrammeTrack } from '../programme/programme-track.entity';
import { Engagement } from '../engagement/engagement.entity';
import { UserEntity } from '../user/users.entity';

/**
 * Remove speakers from programme tracks, sessions and engagement tracks
 * This function removes speakers from all programme sessions within tracks for an event,
 * including tracks that are associated with engagements
 * @param programmeSessionRepository Repository for ProgrammeSession
 * @param programmeTrackRepository Repository for ProgrammeTrack
 * @param engagementRepository Repository for Engagement
 * @param eventId Event ID
 * @param removedSpeakerIds Array of speaker IDs to remove
 */
export async function removeSpeakersFromAssociations(
  programmeSessionRepository: Repository<ProgrammeSession>,
  programmeTrackRepository: Repository<ProgrammeTrack>,
  engagementRepository: Repository<Engagement>,
  eventId: string,
  removedSpeakerIds: string[],
): Promise<void> {
  if (removedSpeakerIds.length === 0) {
    return;
  }

  // Get all tracks for this event with their sessions and speakers
  // This includes both regular programme tracks and tracks used by engagements
  const tracks = await programmeTrackRepository.find({
    where: { eventId },
    relations: ['sessions', 'sessions.speakers'],
  });

  // Get all engagements for this event to identify engagement tracks
  const engagements = await engagementRepository.find({
    where: { track: { eventId } },
    relations: ['track'],
  });

  // Create a set of track IDs that have engagements
  const engagementTrackIds = new Set(
    engagements.map((engagement) => engagement.trackId),
  );

  // Remove speakers from sessions within each track (many-to-many relationship)
  // This handles both regular programme tracks and engagement tracks
  for (const track of tracks) {
    const isEngagementTrack = engagementTrackIds.has(track.id);
    
    if (track.sessions && track.sessions.length > 0) {
      for (const session of track.sessions) {
        if (session.speakers && session.speakers.length > 0) {
          // Filter out removed speakers
          const remainingSpeakers = session.speakers.filter(
            (speaker: UserEntity) => !removedSpeakerIds.includes(speaker.id),
          );

          // Update session with remaining speakers only
          if (remainingSpeakers.length !== session.speakers.length) {
            session.speakers = remainingSpeakers;
            await programmeSessionRepository.save(session);
          }
        }
      }
    }
  }

  // Note: Engagements reference tracks, and tracks have sessions with speakers.
  // When we remove speakers from sessions in engagement tracks, the engagements
  // will automatically reflect the changes since they load sessions from their track.
  // Engagements themselves remain intact - only the speaker associations are removed.
  // Tracks themselves don't have speakers directly - speakers are only on sessions.
}

