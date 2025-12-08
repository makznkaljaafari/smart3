import { useState, useCallback, useMemo } from 'react';

export const useSelection = (itemIds: string[] = []) => {
    const [selectedIds, setSelectedIds] = useState(new Set<string>());

    const handleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        setSelectedIds(prev => {
            if (prev.size === itemIds.length) {
                // Deselect all
                return new Set<string>();
            } else {
                // Select all
                return new Set<string>(itemIds);
            }
        });
    }, [itemIds]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set<string>());
    }, []);

    const isAllSelected = useMemo(() => {
        return itemIds.length > 0 && selectedIds.size === itemIds.length;
    }, [selectedIds, itemIds]);
    

    return {
        selectedIds,
        handleSelect,
        handleSelectAll,
        clearSelection,
        isAllSelected,
    };
};
