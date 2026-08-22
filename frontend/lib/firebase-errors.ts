export type SecurityRuleContext = {
  authUid?: string | null;
  authEmail?: string | null;
  operation: "get" | "list" | "create" | "update" | "delete" | "write";
  path: string;
  timestamp: string;
};

export class FirestoreErrorInfo extends Error {
  context: SecurityRuleContext;
  constructor(message: string, context: SecurityRuleContext) {
    super(message);
    this.name = "FirestoreErrorInfo";
    this.context = context;
  }
}

export function handleFirestoreError(
  error: unknown,
  context: SecurityRuleContext
): never {
  const msg = error instanceof Error ? error.message : String(error);
  const detailedMsg = `Firestore Security/Permission Error during ${context.operation.toUpperCase()} on ${context.path}: ${msg}`;
  console.error(detailedMsg, { context, originalError: error });
  throw new FirestoreErrorInfo(detailedMsg, context);
}
