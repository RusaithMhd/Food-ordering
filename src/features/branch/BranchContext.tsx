'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { hotelService, Branch, Room } from '@/services/hotel.service';
import { logger } from '@/lib/logger';

interface BranchContextType {
  branchId: string | null;
  roomId: string | null;
  branch: Branch | null;
  room: Room | null;
  isLoading: boolean;
  setContext: (branchId: string, roomId?: string) => void;
  clearContext: () => void;
}

const BranchContext = createContext<BranchContextType>({
  branchId: null,
  roomId: null,
  branch: null,
  room: null,
  isLoading: true,
  setContext: () => {},
  clearContext: () => {},
});

export const useBranch = () => useContext(BranchContext);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branchId, setBranchId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Load context from localStorage or URL on mount
  useEffect(() => {
    const initializeContext = async () => {
      setIsLoading(true);
      
      // 1. Check URL parameters first (QR Code scan priority)
      const urlBranchId = searchParams.get('branchId');
      const urlRoomId = searchParams.get('roomId');

      let currentBranchId = urlBranchId || localStorage.getItem('branchId');
      let currentRoomId = urlRoomId || localStorage.getItem('roomId');

      if (currentBranchId) {
        // Validate branch
        const fetchedBranch = await hotelService.getBranch(currentBranchId);
        
        if (fetchedBranch) {
          setBranchId(currentBranchId);
          setBranch(fetchedBranch);
          localStorage.setItem('branchId', currentBranchId);

          if (currentRoomId) {
            // Validate room
            const fetchedRoom = await hotelService.validateRoom(currentBranchId, currentRoomId);
            if (fetchedRoom) {
              setRoomId(currentRoomId);
              setRoom(fetchedRoom);
              localStorage.setItem('roomId', currentRoomId);
            } else {
              // Invalid room
              setRoomId(null);
              setRoom(null);
              localStorage.removeItem('roomId');
            }
          }

          // If we came from a QR code, clean up the URL to prevent sharing the link with params
          if (urlBranchId && pathname === '/') {
            router.replace('/');
          }
        } else {
          // Invalid branch
          clearContext();
        }
      }

      setIsLoading(false);
    };

    initializeContext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setContext = (newBranchId: string, newRoomId?: string) => {
    setBranchId(newBranchId);
    localStorage.setItem('branchId', newBranchId);
    
    if (newRoomId) {
      setRoomId(newRoomId);
      localStorage.setItem('roomId', newRoomId);
    } else {
      setRoomId(null);
      localStorage.removeItem('roomId');
    }
    
    // We would typically trigger a re-fetch of the branch/room details here,
    // but a page reload or router refresh is often cleaner to reset the entire app state
    window.location.reload();
  };

  const clearContext = () => {
    setBranchId(null);
    setRoomId(null);
    setBranch(null);
    setRoom(null);
    localStorage.removeItem('branchId');
    localStorage.removeItem('roomId');
  };

  return (
    <BranchContext.Provider value={{ branchId, roomId, branch, room, isLoading, setContext, clearContext }}>
      {children}
    </BranchContext.Provider>
  );
}
