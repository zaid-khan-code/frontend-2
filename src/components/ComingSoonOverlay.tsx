// src/components/ComingSoonOverlay.tsx

import React from "react";
import styles from "./ComingSoonOverlay.module.css";

/**
 * A reusable overlay that indicates a feature is coming soon.
 * It covers its parent container with a semi‑transparent backdrop
 * and a centered message with subtle animation.
 */
export const ComingSoonOverlay: React.FC = () => {
  return (
    <div className={styles.overlay} data-testid="coming-soon-overlay">
      <div className={styles.content}>🚀 Coming Soon</div>
    </div>
  );
};

export default ComingSoonOverlay;
