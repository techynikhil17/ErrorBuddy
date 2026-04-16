import path from "path";
import { extractRootObject } from "./rootDetector";
import { extractSnippet, highlightSnippet } from "./snippetExtractor";
import { StackLocation } from "./stackParser";

export interface ErrorContext {
  snippet?: string;
  highlightedSnippet?: string;
  accessedProperty?: string;
  rootObject?: string;
  variableName?: string;
  moduleName?: string;
  statusCode?: number;
  jsonToken?: string;
  jsonPosition?: number;
  port?: number;
}

export function enrichErrorContext(message: string, location?: StackLocation): ErrorContext {
  const snippet = location ? extractSnippet(location.file, location.line) : undefined;
  const accessedProperty = extractAccessedProperty(message);
  const rootObject =
    snippet && accessedProperty ? extractRootObject(snippet, accessedProperty) ?? undefined : undefined;
  const variableName = extractVariableName(message, rootObject);
  const moduleName = extractModuleName(message);
  const statusCode = extractStatusCode(message) ?? undefined;
  const jsonDetails = extractJsonErrorDetails(message);
  const focusTarget = resolveFocusTarget({
    snippet,
    rootObject,
    accessedProperty,
    variableName,
    moduleName,
  });

  return {
    snippet,
    highlightedSnippet: snippet && focusTarget ? highlightSnippet(snippet, focusTarget) : snippet,
    accessedProperty,
    rootObject,
    variableName,
    moduleName,
    statusCode,
    jsonToken: jsonDetails?.token,
    jsonPosition: jsonDetails?.position,
  };
}

function resolveFocusTarget(input: {
  snippet?: string;
  rootObject?: string;
  accessedProperty?: string;
  variableName?: string;
  moduleName?: string;
}): string | undefined {
  if (!input.snippet) {
    return undefined;
  }

  if (input.rootObject && input.accessedProperty) {
    return extractAccessChain(input.snippet, input.rootObject, input.accessedProperty);
  }

  if (input.variableName && input.snippet.includes(input.variableName)) {
    return input.variableName;
  }

  if (input.moduleName && input.snippet.includes(input.moduleName)) {
    return input.moduleName;
  }

  return input.accessedProperty;
}

function extractAccessedProperty(message: string): string | undefined {
  const match = message.match(/(?:reading|property)\s+['"]([^'"]+)['"]/i);
  return match?.[1];
}

function extractVariableName(message: string, rootObject?: string): string | undefined {
  if (rootObject) {
    return rootObject;
  }

  const match = message.match(/['"]?([A-Za-z_$][\w$]*)['"]?\s+is not defined/i);
  return match?.[1];
}

function extractModuleName(message: string): string | undefined {
  const quotedMatch = message.match(/Cannot find module ['"]([^'"]+)['"]/i);

  if (!quotedMatch) {
    return undefined;
  }

  const fullTarget = quotedMatch[1];
  return path.basename(fullTarget) || fullTarget;
}

function extractStatusCode(message: string): number | undefined {
  const match = message.match(/status code (\d{3})/i);

  if (!match) {
    return undefined;
  }

  const statusCode = Number(match[1]);
  return Number.isNaN(statusCode) ? undefined : statusCode;
}

function extractJsonErrorDetails(
  message: string,
): { token?: string; position?: number } | undefined {
  const match = message.match(/Unexpected token\s+(.+?)\s+in JSON at position\s+(\d+)/i);

  if (!match) {
    return undefined;
  }

  const [, token, positionText] = match;
  const position = Number(positionText);

  return {
    token: token?.trim(),
    position: Number.isNaN(position) ? undefined : position,
  };
}

function extractAccessChain(
  snippet: string,
  rootObject: string,
  property: string,
): string | undefined {
  const escapedRoot = escapeForRegex(rootObject);
  const escapedProperty = escapeForRegex(property);
  const chainMatch = snippet.match(
    new RegExp(String.raw`\b${escapedRoot}(?:\??\.\s*[A-Za-z_$][\w$]*)*\.\s*${escapedProperty}(?:\??\.\s*[A-Za-z_$][\w$]*)*`),
  );

  return chainMatch?.[0]?.replace(/\s+/g, " ");
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
