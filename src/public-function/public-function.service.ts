import { Injectable } from '@nestjs/common';

@Injectable()
export class PublicFunctionService {
  async compareObjects(original: any, updated: any, category: any = null) {
    const changes = [];
    for (const key in updated) {
      if (updated.hasOwnProperty(key)) {
        if (category == 'user') {
        } else {
          if (original[key] != updated[key]) {
            changes.push({
              from: original[key],
              to: updated[key],
              field: key,
            });
          }
        }
      }
    }

    return changes;
  }
}
