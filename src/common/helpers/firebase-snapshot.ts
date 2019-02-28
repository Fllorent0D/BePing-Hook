import * as admin from 'firebase-admin';
import DataSnapshot = admin.database.DataSnapshot;

export class FirebaseSnapshot {
    static SnapshotToArray<T>(dataSnapshot: DataSnapshot): T[] {
        return Object.keys(dataSnapshot.val() || {}).map(key => dataSnapshot.val()[key]);
    }
}
