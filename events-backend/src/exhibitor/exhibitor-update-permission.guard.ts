import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ExhibitorService } from './exhibitor.service';

/**
 * Guard to check if exhibitor user has permission to update a specific exhibitor
 * This runs BEFORE the file interceptor, preventing file uploads if permission is denied
 */
@Injectable()
export class ExhibitorUpdatePermissionGuard implements CanActivate {
  constructor(private readonly exhibitorService: ExhibitorService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const exhibitorId = request.params?.id;

    // If no exhibitor ID, allow (will be handled by other validators)
    if (!exhibitorId) {
      return true;
    }

    // Admin can always update
    if (user?.role === 'admin') {
      return true;
    }

    // If user is Exhibitor, check permissions
    if (user?.role === 'exhibitor' && user?.id) {
      try {
        const userCanUpdate = await this.exhibitorService.canUserUpdateExhibitor(
          exhibitorId,
          user.id,
          user?.email,
        );

        if (!userCanUpdate) {
          throw new ForbiddenException(
            'You do not have permission to update this exhibitor. You can only update your own exhibitor profile.',
          );
        }

        return true;
      } catch (error) {
        // Re-throw ForbiddenException
        if (error instanceof ForbiddenException) {
          throw error;
        }
        // For other errors, allow (will be handled by service layer)
        return true;
      }
    }

    // For other roles or cases, allow (will be handled by RolesGuard)
    return true;
  }
}

