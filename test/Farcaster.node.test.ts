/**
 * Copyright (c) 2026 Velocity BPA
 * Licensed under the Business Source License 1.1
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Farcaster } from '../nodes/Farcaster/Farcaster.node';

// Mock n8n-workflow
jest.mock('n8n-workflow', () => ({
  ...jest.requireActual('n8n-workflow'),
  NodeApiError: class NodeApiError extends Error {
    constructor(node: any, error: any) { super(error.message || 'API Error'); }
  },
  NodeOperationError: class NodeOperationError extends Error {
    constructor(node: any, message: string) { super(message); }
  },
}));

describe('Farcaster Node', () => {
  let node: Farcaster;

  beforeAll(() => {
    node = new Farcaster();
  });

  describe('Node Definition', () => {
    it('should have correct basic properties', () => {
      expect(node.description.displayName).toBe('Farcaster');
      expect(node.description.name).toBe('farcaster');
      expect(node.description.version).toBe(1);
      expect(node.description.inputs).toContain('main');
      expect(node.description.outputs).toContain('main');
    });

    it('should define 6 resources', () => {
      const resourceProp = node.description.properties.find(
        (p: any) => p.name === 'resource'
      );
      expect(resourceProp).toBeDefined();
      expect(resourceProp!.type).toBe('options');
      expect(resourceProp!.options).toHaveLength(6);
    });

    it('should have operation dropdowns for each resource', () => {
      const operations = node.description.properties.filter(
        (p: any) => p.name === 'operation'
      );
      expect(operations.length).toBe(6);
    });

    it('should require credentials', () => {
      expect(node.description.credentials).toBeDefined();
      expect(node.description.credentials!.length).toBeGreaterThan(0);
      expect(node.description.credentials![0].required).toBe(true);
    });

    it('should have parameters with proper displayOptions', () => {
      const params = node.description.properties.filter(
        (p: any) => p.displayOptions?.show?.resource
      );
      for (const param of params) {
        expect(param.displayOptions.show.resource).toBeDefined();
        expect(Array.isArray(param.displayOptions.show.resource)).toBe(true);
      }
    });
  });

  // Resource-specific tests
describe('Casts Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.neynar.com/v2',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  test('getCast operation should retrieve a cast successfully', async () => {
    const mockResponse = { cast: { hash: '0x123', text: 'Test cast' } };
    
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'operation':
          return 'getCast';
        case 'hash':
          return '0x123';
        case 'type':
          return 'hash';
        case 'viewer_fid':
          return 123;
        default:
          return undefined;
      }
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeCastsOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.neynar.com/v2/cast',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
      },
      qs: {
        identifier: '0x123',
        type: 'hash',
        viewer_fid: 123,
      },
      json: true,
    });

    expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
  });

  test('createCast operation should create a cast successfully', async () => {
    const mockResponse = { success: true, cast: { hash: '0x456' } };
    
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'operation':
          return 'createCast';
        case 'text':
          return 'Hello Farcaster!';
        case 'signer_uuid':
          return 'signer-uuid-123';
        case 'embeds':
          return '';
        case 'parent':
          return '';
        default:
          return undefined;
      }
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeCastsOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://api.neynar.com/v2/cast',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
      },
      body: {
        signer_uuid: 'signer-uuid-123',
        text: 'Hello Farcaster!',
      },
      json: true,
    });

    expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
  });

  test('likeCast operation should like a cast successfully', async () => {
    const mockResponse = { success: true };
    
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'operation':
          return 'likeCast';
        case 'signer_uuid':
          return 'signer-uuid-123';
        case 'target_hash':
          return '0x789';
        case 'like':
          return true;
        default:
          return undefined;
      }
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeCastsOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'PUT',
      url: 'https://api.neynar.com/v2/cast/like',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
      },
      body: {
        signer_uuid: 'signer-uuid-123',
        target_hash: '0x789',
        like: true,
      },
      json: true,
    });

    expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
  });

  test('should handle API errors gracefully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'operation':
          return 'getCast';
        case 'hash':
          return '0x123';
        default:
          return undefined;
      }
    });

    const apiError = new Error('API Error');
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(apiError);
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const result = await executeCastsOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toEqual([{ json: { error: 'API Error' }, pairedItem: { item: 0 } }]);
  });

  test('should throw error when continueOnFail is false', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'operation':
          return 'getCast';
        case 'hash':
          return '0x123';
        default:
          return undefined;
      }
    });

    const apiError = new Error('API Error');
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(apiError);
    mockExecuteFunctions.continueOnFail.mockReturnValue(false);

    await expect(executeCastsOperations.call(mockExecuteFunctions, [{ json: {} }])).rejects.toThrow('API Error');
  });
});

describe('Users Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.neynar.com/v2',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  it('should get users successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'operation': return 'getUsers';
        case 'fids': return '1,2,3';
        case 'viewer_fid': return '1';
        default: return '';
      }
    });

    const mockResponse = {
      result: {
        users: [
          { fid: 1, username: 'test1' },
          { fid: 2, username: 'test2' },
          { fid: 3, username: 'test3' },
        ]
      }
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const items = [{ json: {} }];
    const result = await executeUsersOperations.call(mockExecuteFunctions, items);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: expect.stringContaining('/user/bulk'),
      })
    );
  });

  it('should search users successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'operation': return 'searchUsers';
        case 'q': return 'test';
        case 'limit': return 10;
        default: return '';
      }
    });

    const mockResponse = {
      result: {
        users: [{ fid: 1, username: 'test' }]
      }
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const items = [{ json: {} }];
    const result = await executeUsersOperations.call(mockExecuteFunctions, items);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
  });

  it('should follow user successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'operation': return 'followUser';
        case 'signer_uuid': return 'test-uuid';
        case 'target_fids': return '2,3';
        case 'follow': return true;
        default: return '';
      }
    });

    const mockResponse = { success: true };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const items = [{ json: {} }];
    const result = await executeUsersOperations.call(mockExecuteFunctions, items);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        url: expect.stringContaining('/user/follow'),
      })
    );
  });

  it('should get followers successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'operation': return 'getFollowers';
        case 'fid': return '1';
        case 'limit': return 25;
        case 'sort_type': return 'desc_by_follower_count';
        default: return '';
      }
    });

    const mockResponse = {
      result: {
        users: [{ fid: 2, username: 'follower1' }]
      }
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const items = [{ json: {} }];
    const result = await executeUsersOperations.call(mockExecuteFunctions, items);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
  });

  it('should handle errors correctly', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      return param === 'operation' ? 'getUsers' : '';
    });

    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const items = [{ json: {} }];
    const result = await executeUsersOperations.call(mockExecuteFunctions, items);

    expect(result).toHaveLength(1);
    expect(result[0].json.error).toBe('API Error');
  });

  it('should lookup user by verification successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      switch (param) {
        case 'operation': return 'lookupUserByVerification';
        case 'verification_address': return '0x123...';
        case 'viewer_fid': return '1';
        default: return '';
      }
    });

    const mockResponse = {
      result: { user: { fid: 123, username: 'verified_user' } }
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const items = [{ json: {} }];
    const result = await executeUsersOperations.call(mockExecuteFunctions, items);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: expect.stringContaining('/user/lookup'),
      })
    );
  });
});

describe('Channels Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.neynar.com/v2',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  it('should get channel details successfully', async () => {
    const mockResponse = {
      channel: {
        id: 'test-channel',
        name: 'Test Channel',
        description: 'A test channel',
      },
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((key: string) => {
      switch (key) {
        case 'operation': return 'getChannel';
        case 'id': return 'test-channel';
        case 'type': return 'id';
        case 'viewer_fid': return 123;
        default: return undefined;
      }
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeChannelsOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: expect.stringContaining('/channel?'),
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-api-key',
      }),
      json: true,
    });
  });

  it('should search channels successfully', async () => {
    const mockResponse = {
      channels: [
        { id: 'channel1', name: 'Channel 1' },
        { id: 'channel2', name: 'Channel 2' },
      ],
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((key: string) => {
      switch (key) {
        case 'operation': return 'searchChannels';
        case 'q': return 'test query';
        case 'viewer_fid': return 123;
        case 'limit': return 10;
        default: return undefined;
      }
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeChannelsOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
  });

  it('should follow channel successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'Channel followed successfully',
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((key: string) => {
      switch (key) {
        case 'operation': return 'followChannel';
        case 'signer_uuid': return 'test-signer-uuid';
        case 'channel_id': return 'test-channel';
        case 'follow': return true;
        default: return undefined;
      }
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeChannelsOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'PUT',
      url: expect.stringContaining('/channel/follow'),
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-api-key',
      }),
      body: {
        signer_uuid: 'test-signer-uuid',
        channel_id: 'test-channel',
        follow: true,
      },
      json: true,
    });
  });

  it('should handle errors gracefully when continueOnFail is true', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((key: string) => {
      switch (key) {
        case 'operation': return 'getChannel';
        case 'id': return 'invalid-channel';
        case 'type': return 'id';
        default: return undefined;
      }
    });

    mockExecuteFunctions.continueOnFail.mockReturnValue(true);
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));

    const result = await executeChannelsOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.error).toBe('API Error');
  });

  it('should throw error when continueOnFail is false', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((key: string) => {
      switch (key) {
        case 'operation': return 'getChannel';
        case 'id': return 'invalid-channel';
        case 'type': return 'id';
        default: return undefined;
      }
    });

    mockExecuteFunctions.continueOnFail.mockReturnValue(false);
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));

    await expect(
      executeChannelsOperations.call(mockExecuteFunctions, [{ json: {} }])
    ).rejects.toThrow();
  });

  it('should invite user to channel successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'User invited successfully',
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((key: string) => {
      switch (key) {
        case 'operation': return 'inviteToChannel';
        case 'signer_uuid': return 'test-signer-uuid';
        case 'channel_id': return 'test-channel';
        case 'fid': return 456;
        case 'role': return 'member';
        default: return undefined;
      }
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeChannelsOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: expect.stringContaining('/channel/invite'),
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-api-key',
      }),
      body: {
        signer_uuid: 'test-signer-uuid',
        channel_id: 'test-channel',
        fid: 456,
        role: 'member',
      },
      json: true,
    });
  });
});

describe('Frames Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.neynar.com/v2',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  describe('validateFrame', () => {
    it('should validate frame metadata successfully', async () => {
      const mockResponse = { valid: true, metadata: {} };
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('validateFrame')
        .mockReturnValueOnce('https://example.com/frame')
        .mockReturnValueOnce('https://example.com/frames');
      
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeFramesOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.neynar.com/v2/farcaster/frame/validate',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: {
          url: 'https://example.com/frame',
          frames_url: 'https://example.com/frames',
        },
        json: true,
      });

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });

    it('should handle validation errors', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('validateFrame')
        .mockReturnValueOnce('invalid-url')
        .mockReturnValueOnce('');

      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Invalid URL'));
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      const result = await executeFramesOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: { error: 'Invalid URL' }, pairedItem: { item: 0 } }]);
    });
  });

  describe('processFrameAction', () => {
    it('should process frame action successfully', async () => {
      const mockResponse = { success: true, result: {} };
      const untrustedData = { button_index: 1 };
      const trustedData = { message_bytes: 'test' };

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('processFrameAction')
        .mockReturnValueOnce('button_click')
        .mockReturnValueOnce(untrustedData)
        .mockReturnValueOnce(trustedData);
      
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeFramesOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.neynar.com/v2/farcaster/frame/action',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: {
          action: 'button_click',
          untrusted_data: untrustedData,
          trusted_data: trustedData,
        },
        json: true,
      });

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });
  });

  describe('getFrame', () => {
    it('should get frame metadata successfully', async () => {
      const mockResponse = { frame: { title: 'Test Frame' } };
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getFrame')
        .mockReturnValueOnce('https://example.com/frame');
      
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeFramesOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.neynar.com/v2/farcaster/frame',
        headers: {
          'Authorization': 'Bearer test-api-key',
        },
        qs: { url: 'https://example.com/frame' },
        json: true,
      });

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });
  });

  describe('createDeveloperFrame', () => {
    it('should create developer frame successfully', async () => {
      const mockResponse = { frame_id: '123', status: 'created' };
      const buttons = [{ text: 'Click me', action: 'post' }];

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('createDeveloperFrame')
        .mockReturnValueOnce('https://example.com/frame')
        .mockReturnValueOnce('Test Frame')
        .mockReturnValueOnce('https://example.com/image.png')
        .mockReturnValueOnce(buttons)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});
      
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeFramesOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.neynar.com/v2/farcaster/frame/developer-managed',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: {
          url: 'https://example.com/frame',
          name: 'Test Frame',
          image: 'https://example.com/image.png',
          buttons: buttons,
          input: {},
          state: {},
        },
        json: true,
      });

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });
  });

  describe('deleteDeveloperFrame', () => {
    it('should delete developer frame successfully', async () => {
      const mockResponse = { success: true, message: 'Frame deleted' };
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('deleteDeveloperFrame')
        .mockReturnValueOnce('https://example.com/frame');
      
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeFramesOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'DELETE',
        url: 'https://api.neynar.com/v2/farcaster/frame/developer-managed',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: { url: 'https://example.com/frame' },
        json: true,
      });

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });
  });
});

describe('Authentication Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.neynar.com/v2',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  test('signInWithFarcaster should initiate SIWF authentication', async () => {
    const mockResponse = { 
      success: true, 
      authUrl: 'https://warpcast.com/auth/12345',
      nonce: 'test-nonce'
    };
    
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      switch (paramName) {
        case 'operation': return 'signInWithFarcaster';
        case 'domain': return 'example.com';
        case 'uri': return 'https://example.com';
        case 'nonce': return 'test-nonce';
        case 'statement': return 'Sign in to Example App';
        default: return undefined;
      }
    });
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);
    
    const result = await executeAuthenticationOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );
    
    expect(result[0].json).toEqual(mockResponse);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://api.neynar.com/v2/auth/siwf',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
      },
      body: {
        domain: 'example.com',
        uri: 'https://example.com',
        nonce: 'test-nonce',
        statement: 'Sign in to Example App',
      },
      json: true,
    });
  });

  test('verifySignature should verify Ed25519 signature', async () => {
    const mockResponse = { 
      valid: true,
      fid: 12345
    };
    
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      switch (paramName) {
        case 'operation': return 'verifySignature';
        case 'signature': return 'test-signature';
        case 'message': return 'test-message';
        case 'publicKey': return 'test-public-key';
        case 'fid': return 12345;
        default: return undefined;
      }
    });
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);
    
    const result = await executeAuthenticationOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );
    
    expect(result[0].json).toEqual(mockResponse);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://api.neynar.com/v2/auth/verify',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
      },
      body: {
        signature: 'test-signature',
        message: 'test-message',
        public_key: 'test-public-key',
        fid: 12345,
      },
      json: true,
    });
  });

  test('getCustodyAddress should get custody address for FID', async () => {
    const mockResponse = { 
      custody_address: '0x123...',
      fid: 12345
    };
    
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      switch (paramName) {
        case 'operation': return 'getCustodyAddress';
        case 'fid': return 12345;
        default: return undefined;
      }
    });
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);
    
    const result = await executeAuthenticationOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );
    
    expect(result[0].json).toEqual(mockResponse);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.neynar.com/v2/auth/custody-address',
      headers: {
        'Authorization': 'Bearer test-api-key',
      },
      qs: {
        fid: 12345,
      },
      json: true,
    });
  });

  test('createSigner should register new signer', async () => {
    const mockResponse = { 
      signer_uuid: 'test-uuid',
      status: 'pending'
    };
    
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      switch (paramName) {
        case 'operation': return 'createSigner';
        case 'publicKey': return 'test-public-key';
        case 'requestId': return 'test-request-id';
        case 'signature': return 'test-signature';
        case 'deadline': return 1234567890;
        case 'fid': return 12345;
        default: return undefined;
      }
    });
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);
    
    const result = await executeAuthenticationOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );
    
    expect(result[0].json).toEqual(mockResponse);
  });

  test('should handle errors correctly', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      if (paramName === 'operation') return 'signInWithFarcaster';
      return 'test-value';
    });
    
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);
    
    const result = await executeAuthenticationOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );
    
    expect(result[0].json).toEqual({ error: 'API Error' });
  });
});

describe('Notifications Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.neynar.com/v2',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  describe('getNotifications', () => {
    it('should get notifications successfully', async () => {
      const mockResponse = {
        result: {
          notifications: [],
          next: { cursor: 'next-cursor' }
        }
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        switch (paramName) {
          case 'operation': return 'getNotifications';
          case 'fid': return 12345;
          case 'priority_mode': return true;
          case 'cursor': return 'test-cursor';
          default: return undefined;
        }
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeNotificationsOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual(mockResponse);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.neynar.com/v2/notifications?fid=12345&priority_mode=true&cursor=test-cursor',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        json: true,
      });
    });
  });

  describe('markNotificationsSeen', () => {
    it('should mark notifications as seen successfully', async () => {
      const mockResponse = { success: true };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        switch (paramName) {
          case 'operation': return 'markNotificationsSeen';
          case 'signer_uuid': return 'test-uuid';
          case 'type': return 'mention';
          default: return undefined;
        }
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeNotificationsOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual(mockResponse);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'PUT',
        url: 'https://api.neynar.com/v2/notifications/seen',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: {
          signer_uuid: 'test-uuid',
          type: 'mention',
        },
        json: true,
      });
    });
  });

  describe('createWebhook', () => {
    it('should create webhook successfully', async () => {
      const mockResponse = { webhook_id: 'webhook-123', success: true };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        switch (paramName) {
          case 'operation': return 'createWebhook';
          case 'name': return 'Test Webhook';
          case 'url': return 'https://example.com/webhook';
          case 'subscription': return '{"events": ["cast.created"]}';
          default: return undefined;
        }
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeNotificationsOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual(mockResponse);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.neynar.com/v2/webhook',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: {
          name: 'Test Webhook',
          url: 'https://example.com/webhook',
          subscription: { events: ['cast.created'] },
        },
        json: true,
      });
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        if (paramName === 'operation') return 'getNotifications';
        if (paramName === 'fid') return 12345;
        return undefined;
      });

      const error = new Error('API Error');
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(error);

      await expect(executeNotificationsOperations.call(mockExecuteFunctions, [{ json: {} }]))
        .rejects.toThrow();
    });

    it('should continue on fail when configured', async () => {
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);
      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        if (paramName === 'operation') return 'getNotifications';
        if (paramName === 'fid') return 12345;
        return undefined;
      });

      const error = new Error('API Error');
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(error);

      const result = await executeNotificationsOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json.error).toBe('API Error');
    });
  });
});
});
