import prisma from '../config/db.js';

// Log meaningful state changes only. Never pass credentials, chat bodies, or GPS coordinates.
// An audit-storage failure must not prevent a citizen from requesting help.
export async function recordActivity(actor, action, { subjectType = null, subjectId = null, details = null } = {}) {
    try {
        await prisma.activityLog.create({
            data: {
                actorId: actor.id,
                actorName: actor.name,
                actorEmail: actor.email,
                actorRole: actor.role,
                action,
                subjectType,
                subjectId: subjectId == null ? null : String(subjectId),
                details,
            },
        });
    } catch (error) {
        console.error('[Activity audit write failed]', { action, actorId: actor.id, code: error?.code });
    }
}
