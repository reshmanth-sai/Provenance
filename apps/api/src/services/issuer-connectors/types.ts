import { DocumentAnalysisSignal } from "../analysis-pipeline.js";

export interface IssuerConnector {
  id: string;
  displayName: string;
  aliases: string[];
  host: string;
  pathTemplates: string[];
  codePattern: RegExp;
  parseResponse(html: string, code: string): { parsedName: string | null; notFound: boolean };
}

export type ConnectorLookupOutcome =
  | "name_match"
  | "name_mismatch"
  | "code_not_found"
  | "unavailable";

export interface ConnectorLookupResult {
  outcome: ConnectorLookupOutcome;
  httpStatus: number | null;
  rawNameHash: string | null;
  matchedTemplate?: string;
  signal?: DocumentAnalysisSignal;
}
