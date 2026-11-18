import { deleteExpiredPendingObjects } from "./object.services.js";

const CLEANUP_INTERVAL_MS = 60 * 1000;

export const startExpiredObjectsCleanupScheduler = () => {
  let running = false;

  const runCleanup = async () => {
    if (running) return;
    running = true;

    try {
      let totalDeleted = 0;
      let batch;

      do {
        batch = await deleteExpiredPendingObjects();
        totalDeleted += batch.deletedCount;

        if (batch.failedPhotoFiles.length > 0) {
          console.error(
            "No se pudieron eliminar algunos archivos de objetos vencidos:",
            batch.failedPhotoFiles,
          );
        }
      } while (batch.deletedCount > 0);

      if (totalDeleted > 0) {
        console.info(`Se eliminaron ${totalDeleted} pre-inscripciones vencidas.`);
      }
    } catch (error) {
      console.error("Error al eliminar pre-inscripciones vencidas:", error);
    } finally {
      running = false;
    }
  };

  void runCleanup();
  return setInterval(runCleanup, CLEANUP_INTERVAL_MS);
};