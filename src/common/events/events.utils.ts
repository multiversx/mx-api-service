
import { ID_PREFIX, ADDRESS_PREFIX } from "./events.types";

export function addressToken(address: string): string {
    return ADDRESS_PREFIX + address;
}

export function idToken(identifier: string): string {
    return ID_PREFIX + identifier;
}

export function idAddressToken(address: string, identifier: string): string {
    return ID_PREFIX + ADDRESS_PREFIX + address + '_' + identifier;
}

/**
 * Checks if room name is of type address, identifier or both
 * 
 * @param roomName 
 * @returns 
 */
export function checkRoomType(roomName: string) {
    if (roomName.includes(ID_PREFIX) || roomName.includes(ADDRESS_PREFIX) || roomName.includes(ID_PREFIX + ADDRESS_PREFIX)) {
        return true;
    }
    return false;
}

/**
 * Substract prefix from room name
 * 
 * @param roomName 
 */
export function trimRoomName(roomName: string) {
    return roomName.removePrefix(ID_PREFIX).removePrefix(ADDRESS_PREFIX).removePrefix(ID_PREFIX + ADDRESS_PREFIX);
}
