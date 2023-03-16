import { describe, it, expect } from 'vitest';
import { findBody, findPathParams } from '../src/internal-utils';
import { RequestUrl } from '../src/types';

describe('utils', () => {
  it('should return empty params if no url exists', () => {
    expect(findPathParams('' as RequestUrl, undefined)).toEqual({});
  });

  it('should return undefind if no body is defined', () => {
    expect(findBody(null as any, undefined)).toBe(undefined);
  });
});
