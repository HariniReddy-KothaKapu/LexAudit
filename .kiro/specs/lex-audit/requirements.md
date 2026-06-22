# Requirements Document

## Introduction

LexAudit is an AI-powered contract risk analyzer that helps businesses and individuals understand legal contracts before signing them. The system allows users to upload contracts in PDF or DOCX format, automatically extracts and classifies clauses, evaluates risk using Google Gemini AI, computes a custom risk score, generates plain-English explanations and negotiation recommendations, and presents results through an interactive dashboard. All analyses are persisted per user, enabling historical review and comparison.

## Glossary

- **System**: The LexAudit application as a whole, including frontend and backend.
- **User**: An authenticated individual or business representative using the System.
- **Contract**: A legal document uploaded by the User in PDF or DOCX format.
- **Clause**: A distinct, identifiable section of a Contract with legal significance.
- **Clause_Detector**: The backend component responsible for identifying and classifying Clauses within extracted text.
- **Risk_Analyzer**: The backend component that integrates with the Gemini API to evaluate risk for each Clause.
- **Scoring_Engine**: The backend component that computes the overall Contract Risk Score.
- **Text_Extractor**: The backend component that parses uploaded PDF and DOCX files into plain text.
- **Auth_Service**: The backend component responsible for User registration, login, and JWT issuance.
- **Summary_Generator**: The backend component that produces the Executive Summary for a Contract.
- **Negotiation_Engine**: The backend component that produces negotiation recommendations for risky Clauses.
- **Dashboard**: The frontend page that displays aggregated analytics across all of a User's analyzed Contracts.
- **Analysis_Result**: The full structured output produced for a Contract, including Clauses, risk scores, summary, and recommendations.
- **Risk_Score**: An integer from 0 to 100 representing the overall risk level of a Contract.
- **Risk_Level**: A categorical label — Low, Medium, or High — assigned to a Clause or Contract.
- **Severity_Score**: An integer from 1 to 10 representing the severity of risk for an individual Clause.
- **JWT**: A JSON Web Token used to authenticate API requests.
- **Gemini_API**: Google Gemini's language model API used for AI-powered analysis.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a new visitor, I want to register for an account, so that I can securely store and manage my contract analyses.

#### Acceptance Criteria

1. WHEN a registration request is received with a valid name, email, and password, THE Auth_Service SHALL create a new User record in the database and return a JWT.
2. WHEN a registration request is received with an email that already exists, THE Auth_Service SHALL return an error response with HTTP status 409 and a descriptive message.
3. WHEN a registration request is received with a missing or malformed email, THE Auth_Service SHALL return an error response with HTTP status 400 and a descriptive validation message.
4. WHEN a registration request is received with a password shorter than 8 characters, THE Auth_Service SHALL return an error response with HTTP status 400 and a descriptive validation message.
5. THE Auth_Service SHALL store passwords as bcrypt hashes and SHALL NOT store plaintext passwords.

---

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in with my email and password, so that I can access my account and contract history.

#### Acceptance Criteria

1. WHEN a login request is received with a valid email and correct password, THE Auth_Service SHALL return a signed JWT with a 24-hour expiry.
2. WHEN a login request is received with an unrecognized email or incorrect password, THE Auth_Service SHALL return an error response with HTTP status 401 and a generic "invalid credentials" message.
3. WHEN a login request is received with a missing email or password field, THE Auth_Service SHALL return an error response with HTTP status 400 and a descriptive validation message.
4. THE System SHALL accept the JWT in the Authorization header as a Bearer token for all protected API endpoints.
5. WHEN a request to a protected endpoint is received without a valid JWT, THE Auth_Service SHALL return an error response with HTTP status 401.

---

### Requirement 3: Contract Upload

**User Story:** As a logged-in user, I want to upload a contract file, so that the system can analyze it for risks.

#### Acceptance Criteria

1. WHEN a file upload request is received with a valid PDF or DOCX file, THE System SHALL accept the file and initiate the analysis pipeline.
2. WHEN a file upload request is received with a file exceeding 10 MB, THE System SHALL reject the upload and return an error response with HTTP status 413 and a descriptive message.
3. WHEN a file upload request is received with a file type other than PDF or DOCX, THE System SHALL reject the upload and return an error response with HTTP status 415 and a descriptive message.
4. WHEN a file upload request is received with an empty file, THE System SHALL reject the upload and return an error response with HTTP status 400 and a descriptive message.
5. WHEN a file is accepted, THE System SHALL store the file metadata — including userId, fileName, file size, and uploadDate — in the Contracts collection in MongoDB.
6. THE System SHALL support drag-and-drop file selection in the upload interface in addition to standard file picker selection.

---

### Requirement 4: Text Extraction

**User Story:** As a user who uploaded a contract, I want the system to extract the full text from my document, so that AI analysis can be performed on the content.

#### Acceptance Criteria

1. WHEN a PDF file is accepted for analysis, THE Text_Extractor SHALL extract all readable text from the file using pdf-parse.
2. WHEN a DOCX file is accepted for analysis, THE Text_Extractor SHALL extract all readable text from the file using mammoth.
3. WHEN text extraction produces an empty result, THE Text_Extractor SHALL mark the Contract as failed with a descriptive error and SHALL NOT proceed to clause detection.
4. THE Text_Extractor SHALL remove non-content artifacts such as repeated whitespace, page headers, footers, and page numbers from the extracted text before storage.
5. THE System SHALL store the cleaned extracted text in the Contracts collection associated with the Contract record.
6. THE Text_Extractor SHALL split the cleaned text into logical sections based on numbered headings, capitalized headings, or paragraph boundaries for downstream clause detection.

---

### Requirement 5: Clause Detection

**User Story:** As a user, I want the system to automatically identify specific legal clause types in my contract, so that I know which provisions are present.

#### Acceptance Criteria

1. WHEN extracted text is available for a Contract, THE Clause_Detector SHALL identify and classify Clauses into the following types where present: Termination, Liability, Indemnification, Confidentiality, Payment Terms, Intellectual Property, Governing Law, Non-Compete, Data Privacy, and Arbitration.
2. WHEN a Clause is identified, THE Clause_Detector SHALL store the clause type, the original clause text, and the associated contractId in the Clauses collection in MongoDB.
3. WHEN no text segment matches a given clause type, THE Clause_Detector SHALL record that clause type as absent for the Contract.
4. THE Clause_Detector SHALL process all ten clause types for every Contract regardless of contract domain or industry.

---

### Requirement 6: AI Risk Analysis

**User Story:** As a user, I want each identified clause to be evaluated for risk by AI, so that I understand which clauses may be harmful to me.

#### Acceptance Criteria

1. WHEN a Clause is detected, THE Risk_Analyzer SHALL send the clause text to the Gemini_API with a structured prompt requesting: clause type, Risk_Level (Low, Medium, or High), Severity_Score (1–10), plain-English explanation, business impact, and legal impact.
2. WHEN the Gemini_API returns a valid response, THE Risk_Analyzer SHALL parse and store the Risk_Level, Severity_Score, explanation, business impact, and legal impact in the Clauses collection for that Clause.
3. WHEN the Gemini_API returns an error or times out, THE Risk_Analyzer SHALL retry the request once and, IF the retry also fails, THEN THE Risk_Analyzer SHALL mark the Clause risk analysis as unavailable and continue processing remaining Clauses.
4. THE Risk_Analyzer SHALL complete analysis for all detected Clauses before the Scoring_Engine begins computation.
5. WHILE processing a Contract, THE System SHALL provide the User with a progress indicator showing the current analysis stage.

---

### Requirement 7: Plain-English Translation

**User Story:** As a user without a legal background, I want each clause explained in simple language, so that I can understand what I am agreeing to.

#### Acceptance Criteria

1. WHEN a Clause has been risk-analyzed, THE Risk_Analyzer SHALL generate a plain-English explanation of the clause text describing what the clause means for the User.
2. THE Risk_Analyzer SHALL store the plain-English explanation alongside the technical risk fields in the Clauses collection.
3. THE System SHALL display the plain-English explanation on the Analysis_Result page for each Clause.
4. THE Risk_Analyzer SHALL generate explanations that avoid legal jargon and are written at a general-public reading level.

---

### Requirement 8: Negotiation Recommendations

**User Story:** As a user, I want negotiation advice for risky clauses, so that I can request fairer contract terms.

#### Acceptance Criteria

1. WHEN a Clause has a Risk_Level of Medium or High, THE Negotiation_Engine SHALL generate: a reason the clause is risky, one or more safer alternative formulations, negotiation talking points, and suggested modified wording.
2. THE Negotiation_Engine SHALL store all negotiation recommendations in the Clauses collection associated with the Clause.
3. THE System SHALL display negotiation recommendations on the Analysis_Result page only for Clauses with Risk_Level Medium or High.
4. WHEN a Clause has a Risk_Level of Low, THE System SHALL display the clause analysis without negotiation recommendations.

---

### Requirement 9: Contract Risk Score

**User Story:** As a user, I want an overall risk score for my contract, so that I can quickly assess how risky it is to sign.

#### Acceptance Criteria

1. WHEN all Clause risk analyses are complete, THE Scoring_Engine SHALL compute a Risk_Score as an integer between 0 and 100 using the following weighted formula: 40% weight on the proportion of High-risk Clauses, 30% weight on the average Severity_Score across all analyzed Clauses (normalized to 0–100), 20% weight on the count of missing critical Clauses (Confidentiality, Termination, Dispute Resolution, Data Protection, Liability Limitation) as a fraction of 5, and 10% weight on the ratio of obligations that favor only one party as identified by the Gemini_API.
2. WHEN the Risk_Score is between 0 and 30 inclusive, THE Scoring_Engine SHALL assign a Risk_Level of Low to the Contract.
3. WHEN the Risk_Score is between 31 and 60 inclusive, THE Scoring_Engine SHALL assign a Risk_Level of Medium to the Contract.
4. WHEN the Risk_Score is between 61 and 100 inclusive, THE Scoring_Engine SHALL assign a Risk_Level of High to the Contract.
5. THE Scoring_Engine SHALL store the Risk_Score and Contract-level Risk_Level in the Contracts collection.
6. THE System SHALL display the Risk_Score visually using a gauge or donut chart on the Analysis_Result page.

---

### Requirement 10: Missing Clause Detection

**User Story:** As a user, I want to be alerted about missing critical clauses, so that I know what protections are absent from the contract.

#### Acceptance Criteria

1. WHEN Clause detection is complete, THE Clause_Detector SHALL check whether the following clause types are absent: Confidentiality, Termination, Dispute Resolution, Data Protection, and Liability Limitation.
2. WHEN one or more critical clause types are absent, THE System SHALL generate an alert for each absent clause type and store it in the Contract record.
3. THE System SHALL display missing clause alerts prominently on the Analysis_Result page with a descriptive explanation of why each missing clause is significant.
4. THE Scoring_Engine SHALL factor the count of missing critical Clauses into the Risk_Score computation as specified in Requirement 9.

---

### Requirement 11: Executive Summary

**User Story:** As a user, I want an executive summary of the contract analysis, so that I can quickly understand the key findings without reading every clause.

#### Acceptance Criteria

1. WHEN all Clause analyses, risk scoring, and missing clause detection are complete, THE Summary_Generator SHALL produce an Executive Summary containing: a contract overview paragraph, a list of the top three highest-risk Clauses, a list of missing critical protections, a list of recommended actions, and a final recommendation statement.
2. THE Summary_Generator SHALL generate the Executive Summary using the Gemini_API, providing it with the full list of analyzed Clauses, Risk_Score, Risk_Level, and missing clause alerts as context.
3. THE Summary_Generator SHALL store the Executive Summary text in the Contracts collection associated with the Contract record.
4. THE System SHALL display the Executive Summary at the top of the Analysis_Result page before the clause-level breakdown.

---

### Requirement 12: Analysis Results Display

**User Story:** As a user, I want to view a detailed results page after analysis, so that I can explore every aspect of my contract's risk profile.

#### Acceptance Criteria

1. WHEN a Contract analysis is complete, THE System SHALL display the Analysis_Result page containing: the Executive Summary, the Risk_Score with a visual gauge, missing clause alerts, and a per-Clause breakdown.
2. THE System SHALL display each Clause on the Analysis_Result page with: clause type, original clause text, Risk_Level badge, Severity_Score, plain-English explanation, business impact, legal impact, and (for Medium/High Clauses) negotiation recommendations.
3. THE System SHALL allow the User to filter the clause list on the Analysis_Result page by Risk_Level (All, Low, Medium, High).
4. THE System SHALL allow the User to expand or collapse individual Clause detail cards on the Analysis_Result page.

---

### Requirement 13: User Dashboard

**User Story:** As a user, I want a dashboard showing my contract analytics, so that I can track my analysis history and risk trends.

#### Acceptance Criteria

1. WHEN a User accesses the Dashboard, THE System SHALL display: total number of Contracts analyzed, average Risk_Score across all Contracts, the five most recent Contract analyses with their Risk_Level and upload date, a risk distribution chart showing the count of Low, Medium, and High risk Contracts, and a clause type frequency chart showing how often each clause type has appeared across all Contracts.
2. THE System SHALL update all Dashboard metrics in real time after each new Contract analysis completes.
3. WHILE the Dashboard data is loading, THE System SHALL display a loading skeleton or spinner.

---

### Requirement 14: Contract History and Search

**User Story:** As a user, I want to search and browse my previous contract analyses, so that I can revisit past results.

#### Acceptance Criteria

1. WHEN a User accesses the Contract History page, THE System SHALL display a paginated list of all Contracts analyzed by that User, sorted by uploadDate descending, with 10 Contracts per page.
2. WHEN a User submits a search query on the Contract History page, THE System SHALL filter the list to Contracts whose fileName contains the query string, case-insensitively.
3. WHEN a User selects a Risk_Level filter on the Contract History page, THE System SHALL filter the list to Contracts with the matching Contract-level Risk_Level.
4. WHEN a User selects a Contract from the history list, THE System SHALL navigate to the Analysis_Result page for that Contract.
5. WHEN a User requests deletion of a Contract, THE System SHALL permanently delete the Contract record, all associated Clause records, and all alerts from MongoDB, and SHALL remove the Contract from the history list.

---

### Requirement 15: User Profile

**User Story:** As a user, I want to view and update my profile, so that I can manage my account information.

#### Acceptance Criteria

1. WHEN a User accesses the Profile page, THE System SHALL display the User's name, email address, and account creation date.
2. WHEN a User submits a name update with a non-empty name value, THE System SHALL update the name field in the Users collection and return the updated User record.
3. WHEN a User submits a password change with a valid current password and a new password of at least 8 characters, THE Auth_Service SHALL update the stored bcrypt hash and return HTTP status 200.
4. WHEN a User submits a password change with an incorrect current password, THE Auth_Service SHALL return HTTP status 401 and a descriptive error message.

---

### Requirement 16: API Error Handling and Resilience

**User Story:** As a user, I want clear error messages when something goes wrong, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. IF an unhandled exception occurs in the backend, THEN THE System SHALL return HTTP status 500 with a generic error message and SHALL log the full error details server-side.
2. IF the Gemini_API is unavailable for a sustained period, THEN THE System SHALL mark the affected Contract analysis as partially complete, store whatever results were successfully obtained, and notify the User with a descriptive message.
3. WHEN any API request fails validation, THE System SHALL return HTTP status 400 with a structured JSON error body listing each validation failure by field name.
4. THE System SHALL enforce rate limiting of 30 analysis requests per User per hour and, WHEN the limit is exceeded, SHALL return HTTP status 429 with a Retry-After header.
