export interface ProjectChanges {
  [key: string]: string | number | boolean | undefined;
}

export interface Project {
  id: number;
  costEstimator: string;
  projectManager: string;
  constructionContractor: string;
  ade: string;
  pmoId: string;
  order: string;
  mat: string;
  projectName: string;
  workStream: string;
  workType: string;
  engrPlanYear: number;
  constPlanYear: number;
  commitmentDate: string;
  thirtyPercentDesignReviewMeeting: string;
  thirtyPercentDesignAvailable: string;
  sixtyPercentDesignReviewMeeting: string;
  sixtyPercentDesignAvailable: string;
  ninetyPercentDesignReviewMeeting: string;
  ninetyPercentDesignAvailable: string;
  ifc: string;
  class5: string;
  class4: string;
  class3: string;
  class2: string;
  negotiatePrice: string;
  jeReadyToRoute: string;
  jeApproved: string;
  estimateAnalysis: string;
  ntp: string;
  mob: string;
  mp1: string;
  mp2: string;
  line: string;
  tieIn: string;
  city: string;
  county: string;
  last_updated?: string;
  is_changed?: boolean;
  _changes?: ProjectChanges;
  dateCategory?: DateCategory;
  [key: string]: string | number | boolean | undefined | ProjectChanges | undefined;
}

export interface VisibleColumns {
  costEstimator: boolean;
  costEstimatorRequest: boolean;
  projectManager: boolean;
  projectEngineer: boolean;
  designEstimator: boolean;
  constructionContractor: boolean;
  ade: boolean;
  pmoId: boolean;
  order: boolean;
  multipleOrder: boolean;
  bundleId: boolean;
  postEstimate: boolean;
  mat: boolean;
  projectName: boolean;
  workStream: boolean;
  workType: boolean;
  station: boolean;
  line: boolean;
  city: boolean;
  county: boolean;
  engrPlanYear: boolean;
  constPlanYear: boolean;
  commitmentDate: boolean;
  thirtyPercentDesignReviewMeeting: boolean;
  thirtyPercentDesignAvailable: boolean;
  sixtyPercentDesignReviewMeeting: boolean;
  sixtyPercentDesignAvailable: boolean;
  ninetyPercentDesignReviewMeeting: boolean;
  ninetyPercentDesignAvailable: boolean;
  ifc: boolean;
  class5: boolean;
  class4: boolean;
  class3: boolean;
  class2: boolean;
  negotiatePrice: boolean;
  jeReadyToRoute: boolean;
  jeApproved: boolean;
  estimateAnalysis: boolean;
  ntp: boolean;
  mob: boolean;
  mp1: boolean;
  mp2: boolean;
  tieIn: boolean;
  enro: boolean;
  unitCapture: boolean;
}

export type DateCategory = 
  | "thisWeek" 
  | "nextWeek"
  | "thisMonth" 
  | "next3Months" 
  | "future" 
  | "none"; 