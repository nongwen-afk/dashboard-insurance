export type Rect = { left: number; top: number; width: number; height: number };
export type OcrTemplate = Record<string, Rect>;

export interface TemplateConfig {
  default: OcrTemplate;
  byIssuer?: Record<string, OcrTemplate>;
}

/**
 * OCR Coordinate Templates config file.
 * Coordinates are defined in percentages relative to the image size (0.0 to 1.0).
 * 
 * You can add new templates per company here:
 * Under `byIssuer`, add a key matching the official company name returned by findIssuer()
 * and specify the coordinates for that company's document layout.
 */
export const OCR_TEMPLATES: Record<string, TemplateConfig> = {
  act: {
    default: {
      issuer: { left: 0.1, top: 0.0, width: 0.5, height: 0.08 },
      docNumber: { left: 0.4, top: 0.1, width: 0.35, height: 0.06 },
      issuedDate: { left: 0.25, top: 0.18, width: 0.25, height: 0.06 },
      expiryDate: { left: 0.5, top: 0.18, width: 0.25, height: 0.06 },
      licensePlate: { left: 0.3, top: 0.27, width: 0.15, height: 0.06 },
      chassis: { left: 0.45, top: 0.27, width: 0.2, height: 0.06 },
    },
    byIssuer: {
      'บริษัท กลางคุ้มครองผู้ประสบภัยจากรถ จำกัด': {
        issuer: { left: 0.1, top: 0.0, width: 0.5, height: 0.08 },
        docNumber: { left: 0.4, top: 0.1, width: 0.35, height: 0.06 },
        issuedDate: { left: 0.25, top: 0.18, width: 0.25, height: 0.06 },
        expiryDate: { left: 0.5, top: 0.18, width: 0.25, height: 0.06 },
        licensePlate: { left: 0.3, top: 0.27, width: 0.15, height: 0.06 },
        chassis: { left: 0.45, top: 0.27, width: 0.2, height: 0.06 },
      },
      'วิริยะประกันภัย': {
        issuer: { left: 0.1, top: 0.0, width: 0.5, height: 0.08 },
        docNumber: { left: 0.4, top: 0.1, width: 0.35, height: 0.06 },
        issuedDate: { left: 0.25, top: 0.18, width: 0.25, height: 0.06 },
        expiryDate: { left: 0.5, top: 0.18, width: 0.25, height: 0.06 },
        licensePlate: { left: 0.3, top: 0.27, width: 0.15, height: 0.06 },
        chassis: { left: 0.45, top: 0.27, width: 0.2, height: 0.06 },
      },
      'กรุงเทพประกันภัย': {
        issuer: { left: 0, top: 0, width: 0.5, height: 0.08 },
        docNumber: { left: 0, top: 0.1280701754385965, width: 0.40216620891290866, height: 0.028421052631578944 },
        issuedDate: { left: 0.1320590059360326, top: 0.3273684210526316, width: 0.24773190396030834, height: 0.028421052631578944 },
        expiryDate: { left: 0.4569061752458581, top: 0.3256140350877193, width: 0.2295871356427749, height: 0.0319298245614035 },
        licensePlate: { left: 0.28185523168246657, top: 0.382280701754386, width: 0.10917427128554974, height: 0.07929824561403509 },
        chassis: { left: 0.393297599007708, top: 0.3787719298245614, width: 0.2249490564366085, height: 0.07929824561403509 }
      },
      'ASIA INSURANCE': {
        issuer: { left: 0, top: 0, width: 0.2642865629083997, height: 0.08175438596491229 },
        docNumber: { left: 0.25806502712763857, top: 0.17719298245614035, width: 0.2232723456496772, height: 0.028421052631578948 },
        issuedDate: { left: 0.222119916042929, top: 0.26596491228070174, width: 0.222119916042929, height: 0.03368421052631579 },
        expiryDate: { left: 0.5861748049582195, top: 0.26421052631578945, width: 0.19170527899885154, height: 0.03368421052631579 },
        licensePlate: { left: 0.2746544691299354, top: 0.3314035087719298, width: 0.13986178765197418, height: 0.06 },
        chassis: { left: 0.4170508098689161, top: 0.3314035087719298, width: 0.1898617876519742, height: 0.06 }
      }
    }
  },
  tax: {
    default: {
      licensePlate: { left: 0.1, top: 0.4, width: 0.8, height: 0.2 },
      expiryDate: { left: 0.1, top: 0.1, width: 0.8, height: 0.25 },
      chassis: { left: 0.1, top: 0.7, width: 0.8, height: 0.15 },
    }
  },
  insurance: {
    default: {
      issuer: { left: 0.05, top: 0.0, width: 0.5, height: 0.1 },
      docNumber: { left: 0.4, top: 0.08, width: 0.45, height: 0.08 },
      issuedDate: { left: 0.2, top: 0.18, width: 0.3, height: 0.08 },
      expiryDate: { left: 0.5, top: 0.18, width: 0.3, height: 0.08 },
      chassis: { left: 0.3, top: 0.3, width: 0.4, height: 0.08 },
      licensePlate: { left: 0.1, top: 0.3, width: 0.2, height: 0.08 },
    }
  },
  inspection: {
    default: {
      licensePlate: { left: 0.1, top: 0.15, width: 0.4, height: 0.1 },
      chassis: { left: 0.5, top: 0.15, width: 0.4, height: 0.1 },
      expiryDate: { left: 0.1, top: 0.8, width: 0.8, height: 0.15 },
    }
  },
  registration_book: {
    default: {
      chassis: { left: 0.1, top: 0.5, width: 0.8, height: 0.1 },
      licensePlate: { left: 0.1, top: 0.2, width: 0.8, height: 0.1 },
    }
  }
};
