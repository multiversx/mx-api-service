import { EventEmitter2 } from "@nestjs/event-emitter";
import { TestingModule, Test } from "@nestjs/testing";
import { HotSwappableSettingDb } from "src/common/persistence/entities/hot.swappable.setting";
import { KeybaseConfirmationDb } from "src/common/persistence/entities/keybase.confirmation.db";
import { NftMediaDb } from "src/common/persistence/entities/nft.media.db";
import { NftMetadataDb } from "src/common/persistence/entities/nft.metadata.db";
import { NftTraitSummaryDb } from "src/common/persistence/entities/nft.trait.summary.db";
import { PersistenceService } from "src/common/persistence/persistence.service";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { Repository } from "typeorm";

const mockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findByIds: jest.fn(),
});

describe.skip('PersistenceService', () => {
  let service: PersistenceService;
  let nftMetadataRepository: Repository<NftMetadataDb>;
  let nftMediaRepository: Repository<NftMediaDb>;
  let settingsRepository: Repository<HotSwappableSettingDb>;
  let keybaseConfirmationRepository: Repository<KeybaseConfirmationDb>;
  let nftTraitSummaryRepository: Repository<NftTraitSummaryDb>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersistenceService,
        EventEmitter2,
        { provide: 'NftMetadataDbRepository', useFactory: mockRepository },
        { provide: 'NftMediaDbRepository', useFactory: mockRepository },
        { provide: 'NftTraitSummaryDbRepository', useFactory: mockRepository },
        { provide: 'KeybaseConfirmationDbRepository', useFactory: mockRepository },
        { provide: 'HotSwappableSettingDbRepository', useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<PersistenceService>(PersistenceService);
    nftMetadataRepository = module.get<Repository<NftMetadataDb>>('NftMetadataDbRepository');
    nftMediaRepository = module.get<Repository<NftMediaDb>>('NftMediaDbRepository');
    settingsRepository = module.get<Repository<HotSwappableSettingDb>>('HotSwappableSettingDbRepository');
    keybaseConfirmationRepository = module.get<Repository<KeybaseConfirmationDb>>('KeybaseConfirmationDbRepository');
    nftTraitSummaryRepository = module.get<Repository<NftTraitSummaryDb>>('NftTraitSummaryDbRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetadata', () => {
    it('should return null if no metadata is found', async () => {
      jest.spyOn(nftMetadataRepository, 'findOne').mockResolvedValue(null);
      expect(await service.getMetadata('test-id')).toBeNull();
      expect(nftMetadataRepository.findOne).toHaveBeenCalledWith({ where: { id: 'test-id' } });
    });

    it('should return the metadata content if metadata is found', async () => {
      const metadataDb = new NftMetadataDb();
      metadataDb.content = { test: 'content' };
      jest.spyOn(nftMetadataRepository, 'findOne').mockResolvedValue(metadataDb);


      const result = await service.getMetadata('test-id');
      expect(result).toEqual({ test: 'content' });
      expect(nftMetadataRepository.findOne).toHaveBeenCalledWith({ where: { id: 'test-id' } });
    });
  });

  describe('setMetadata', () => {
    it('should create new metadata if it does not exist', async () => {
      jest.spyOn(nftMetadataRepository, 'findOne').mockResolvedValue(null);
      await service.setMetadata('test-id', { test: 'content' });
      expect(nftMetadataRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 'test-id',
        content: { test: 'content' },
      }));
    });

    it('should update existing metadata if it exists', async () => {
      const metadataDb = new NftMetadataDb();
      metadataDb.id = 'test-id';
      metadataDb.content = { test: 'old-content' };
      jest.spyOn(nftMetadataRepository, 'findOne').mockResolvedValue(metadataDb);

      await service.setMetadata('test-id', { test: 'new-content' });
      expect(nftMetadataRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 'test-id',
        content: { test: 'new-content' },
      }));
    });
  });

  describe('deleteMetadata', () => {
    it('should delete the metadata', async () => {
      await service.deleteMetadata('test-id');
      expect(nftMetadataRepository.delete).toHaveBeenCalledWith({ id: 'test-id' });
    });
  });

  describe('getMedia', () => {
    it('should return null if no media is found', async () => {
      jest.spyOn(nftMetadataRepository, 'findOne').mockResolvedValue(null);
      expect(await service.getMedia('test-id')).toBeNull();
      expect(nftMediaRepository.findOne).toHaveBeenCalledWith({ where: { id: 'test-id' } });
    });

    it('should return the media content if media is found', async () => {
      const mediaDb = new NftMetadataDb();
      mediaDb.id = 'test-id';
      mediaDb.content = [{ test: 'media' }];
      jest.spyOn(nftMetadataRepository, 'findOne').mockResolvedValue(mediaDb);

      const result = await service.getMedia('test-id');
      expect(result).toEqual(null);
      expect(nftMediaRepository.findOne).toHaveBeenCalledWith({ where: { id: 'test-id' } });
    });
  });

  describe('setSetting', () => {
    it('should save setting', async () => {
      const settingDb = new HotSwappableSettingDb();
      settingDb.name = 'test-name';
      settingDb.value = 'test-value';

      jest.spyOn(settingsRepository, 'findOne').mockResolvedValue(null);

      await service.setSetting('test-name', 'test-value');

      expect(settingsRepository.findOne).toHaveBeenCalledWith({ where: { name: 'test-name' } });
      expect(settingsRepository.save).toHaveBeenCalledWith({
        name: 'test-name',
        value: "test-value",
      });
    });
  });

  describe('getSetting', () => {
    it('should get setting', async () => {
      const settingDb = new HotSwappableSettingDb();
      settingDb.name = 'test-name';
      settingDb.value = JSON.stringify('test-value');

      jest.spyOn(settingsRepository, 'findOne').mockResolvedValue(settingDb);

      const result = await service.getSetting<string>('test-name');

      expect(result).toBe('test-value');
      expect(settingsRepository.findOne).toHaveBeenCalledWith({ where: { name: 'test-name' } });
    });
  });

  describe('setKeybaseConfirmationForIdentity', () => {
    it('should save keybase confirmation', async () => {
      const keybaseConfirmationDb = new KeybaseConfirmationDb();
      keybaseConfirmationDb.identity = 'test-identity';
      keybaseConfirmationDb.keys = ['key1', 'key2'];

      jest.spyOn(keybaseConfirmationRepository, 'findOne').mockResolvedValue(null);
      await service.setKeybaseConfirmationForIdentity('test-identity', ['key1', 'key2']);

      expect(keybaseConfirmationRepository.findOne).toHaveBeenCalledWith({ where: { identity: 'test-identity' } });
      expect(keybaseConfirmationRepository.save).toHaveBeenCalledWith({
        identity: 'test-identity',
        keys: ['key1', 'key2'],
      });
    });
  });

  describe('getKeybaseConfirmationForIdentity', () => {
    it('should get keybase confirmation', async () => {
      const keybaseConfirmationDb = new KeybaseConfirmationDb();
      keybaseConfirmationDb.identity = 'test-identity';
      keybaseConfirmationDb.keys = ['key1', 'key2'];

      jest.spyOn(keybaseConfirmationRepository, 'findOne').mockResolvedValue(keybaseConfirmationDb);

      const result = await service.getKeybaseConfirmationForIdentity('test-identity');

      expect(result).toEqual(['key1', 'key2']);
      expect(keybaseConfirmationRepository.findOne).toHaveBeenCalledWith({ where: { identity: 'test-identity' } });
    });
  });

  describe('getCollectionTraits', () => {
    it('should get collection traits', async () => {
      const traitSummaryDb = new NftTraitSummaryDb();
      traitSummaryDb.identifier = 'test-collection';
      traitSummaryDb.traitTypes = ['trait1', 'trait2'];

      jest.spyOn(nftTraitSummaryRepository, 'findOne').mockResolvedValue(traitSummaryDb);

      const result = await service.getCollectionTraits('test-collection');

      expect(result).toEqual(['trait1', 'trait2']);
      expect(nftTraitSummaryRepository.findOne).toHaveBeenCalledWith({ where: { identifier: 'test-collection' } });
    });
  });

  describe('setMedia', () => {
    it('should save media', async () => {
      const mediaDb = new NftMediaDb();
      mediaDb.id = 'test-id';
      mediaDb.content = 'test-content';

      const media = new NftMedia();

      jest.spyOn(nftMediaRepository, 'findOne').mockResolvedValue(null);

      await service.setMedia('test-id', [media]);

      expect(nftMediaRepository.findOne).toHaveBeenCalledWith({ where: { id: 'test-id' } });
    });
  });

  describe('getAllSettings', () => {
    it('should get all settings', async () => {
      const settingDb1 = new HotSwappableSettingDb();
      settingDb1.name = 'test-name-1';
      settingDb1.value = JSON.stringify('test-value-1');

      const settingDb2 = new HotSwappableSettingDb();
      settingDb2.name = 'test-name-2';
      settingDb2.value = JSON.stringify('test-value-2');

      jest.spyOn(settingsRepository, 'find').mockResolvedValue([settingDb1, settingDb2]);

      const result = await service.getAllSettings();

      expect(result).toEqual([
        { name: 'test-name-1', value: "\"test-value-1\"" },
        { name: 'test-name-2', value: "\"test-value-2\"" },
      ]);
      expect(settingsRepository.find).toHaveBeenCalled();
    });
  });
});
