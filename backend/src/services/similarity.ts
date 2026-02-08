// TF-IDF Similarity Service - In-memory vector similarity search
import natural from 'natural';
import { getAllIncidents, updateIncidentTfidfVector } from '../db/schema';

const TfIdf = natural.TfIdf;

// Global TF-IDF instance
let tfidf: natural.TfIdf;
let documentMap: Map<number, string> = new Map(); // docIndex -> incident_id

/**
 * Initialize or rebuild the TF-IDF index from database
 */
export function initializeTfIdf(): void {
  tfidf = new TfIdf();
  documentMap.clear();
  
  // Get all incidents (limit 1000 for index)
  const incidents = getAllIncidents(1000) as Array<{
    incident_id: string;
    title: string;
    description: string;
    module: string;
    tfidf_vector: string | null;
  }>;
  
  incidents.forEach((incident, index) => {
    const text = `${incident.title} ${incident.description} ${incident.module}`.toLowerCase();
    tfidf.addDocument(text);
    documentMap.set(index, incident.incident_id);
  });
  
  console.log(`✅ TF-IDF index initialized with ${incidents.length} documents`);
}

/**
 * Add a single document to the index
 */
export function addDocumentToIndex(incidentId: string, text: string): void {
  if (!tfidf) {
    initializeTfIdf();
  }
  
  const docIndex = documentMap.size;
  tfidf.addDocument(text.toLowerCase());
  documentMap.set(docIndex, incidentId);
  
  // Store a simple vector representation (top terms)
  const vector = getTermVector(docIndex);
  updateIncidentTfidfVector(incidentId, JSON.stringify(vector));
}

/**
 * Get term vector for a document
 */
function getTermVector(docIndex: number): Record<string, number> {
  const terms: Record<string, number> = {};
  
  tfidf.listTerms(docIndex).slice(0, 50).forEach((item: any) => {
    terms[item.term] = item.tfidf;
  });
  
  return terms;
}

/**
 * Calculate cosine similarity between two term vectors
 */
function cosineSimilarity(vec1: Record<string, number>, vec2: Record<string, number>): number {
  const allTerms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  allTerms.forEach(term => {
    const v1 = vec1[term] || 0;
    const v2 = vec2[term] || 0;
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  });
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Find similar incidents to a query text
 */
export function findSimilarIncidents(
  queryText: string, 
  topK: number = 5,
  excludeIncidentId?: string
): Array<{ incident_id: string; similarity_score: number }> {
  if (!tfidf || documentMap.size === 0) {
    initializeTfIdf();
  }
  
  // Create a temporary document for the query
  const queryTfidf = new TfIdf();
  queryTfidf.addDocument(queryText.toLowerCase());
  
  const queryVector: Record<string, number> = {};
  queryTfidf.listTerms(0).forEach((item: any) => {
    queryVector[item.term] = item.tfidf;
  });
  
  // Calculate similarity with all documents
  const similarities: Array<{ incident_id: string; similarity_score: number }> = [];
  
  documentMap.forEach((incidentId, docIndex) => {
    if (excludeIncidentId && incidentId === excludeIncidentId) {
      return; // Skip self
    }
    
    const docVector = getTermVector(docIndex);
    const similarity = cosineSimilarity(queryVector, docVector);
    
    if (similarity > 0.01) { // Minimum threshold
      similarities.push({
        incident_id: incidentId,
        similarity_score: Math.round(similarity * 1000) / 1000 // Round to 3 decimals
      });
    }
  });
  
  // Sort by similarity and return top K
  return similarities
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, topK);
}

/**
 * Get total document count in index
 */
export function getIndexSize(): number {
  return documentMap.size;
}
