import {WaitingListService} from "../../endpoints/waiting-list/waiting.list.service";
import Initializer from "./e2e-init";
import {Constants} from "../../utils/constants";
import {Test} from "@nestjs/testing";
import {PublicAppModule} from "../../public.app.module";


describe('WaitingListService', ()=>{
    let waitingListService: WaitingListService;
    let waitingListAddress: string;

    beforeAll(async () => {
        await Initializer.initialize();
        const moduleRef = await Test.createTestingModule({
            imports: [PublicAppModule],
        }).compile();

        waitingListService = moduleRef.get<WaitingListService>(WaitingListService);
    }, Constants.oneHour() * 1000);

    describe('Waiting List', ()=>{
        describe('getWaitingList',  ()=>{
            it('should return a list of waiting lists', async ()=>{
                const shardList =  await waitingListService.getWaitingList();
                expect(shardList).toBeInstanceOf(Array);
            })
        })
    });
    describe('Waiting List For Address', ()=>{
        describe('getWaitingListForAddress',  ()=>{
            it('should return a list of waitings for a specified address ', async ()=>{
                const shardList =  await waitingListService.getWaitingListForAddress(waitingListAddress);
                expect(shardList).toBeInstanceOf(Array);
            })
        })
    });
    describe('Waiting List Count', ()=>{
        describe('getWaitingListCount',  ()=>{
            it('should return count of lists', async ()=>{
                const shardList: Number =  new Number(await waitingListService.getWaitingListCount());
                expect(shardList).toBeInstanceOf(Number);
            })
        })
    });
})