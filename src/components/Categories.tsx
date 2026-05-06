import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Category } from '../utils';
import Icon from './Icons';
import { IconName } from '../utils';

// Hierarchical multi-select for statyba categories.
//
// Design:
//   - Level-2 chips flow horizontally in a wrap row, grouped under their
//     level-1 parent (Pastatai / Inžineriniai). Per-chip chevron expands
//     a sub-panel that lists the level-3 leaves beneath every level-2 chip
//     row, so multiple expansions can coexist without breaking the chip
//     layout.
//   - Selection is tracked as a flat number[] in `value`. The user can pick
//     ids at any level — backend `categoryGroup` walks descendants on the
//     server. So picking 'Gyvenamieji' transparently covers its 6 leaves.
//
// Coverage semantics (what the UI shows as "selected"):
//   - A level-2 chip is FULLY covered if its id is in value OR every one of
//     its leaves is in value → renders as selected.
//   - A level-2 chip is PARTIALLY covered if some (not all) of its leaves
//     are in value and the parent isn't → renders selected with "(N/M)".
//   - A leaf chip is EFFECTIVELY selected if its id is in value OR its
//     parent's id is in value (covered transitively).
//
// Click behavior:
//   - Click level-2 (fully covered) → clears parent + all its leaves.
//   - Click level-2 (off / partial)  → consolidate: drops leaf entries,
//     adds the level-2 id. (Functionally identical to "all leaves" via the
//     descendant expansion on the server, but cleaner state.)
//   - Click leaf when its parent is in value → no-op (locked). User must
//     click the parent first to drill into individual leaves.
//   - Click leaf otherwise → toggle the leaf id. If toggling on results in
//     every leaf of that level-2 being selected, auto-consolidate to the
//     parent id.
//
// Skips the 'kita' / 'nepriskirta' branch — subscribing to "uncategorized"
// makes no sense as an intent.
const Categories = ({
  options,
  value,
  onChange,
}: {
  options: Category[];
  value: number[];
  onChange: (ids: number[]) => void;
}) => {
  const [expandedLevel2, setExpandedLevel2] = useState<Set<number>>(new Set());
  const valueSet = useMemo(() => new Set(value), [value]);

  const groups = useMemo(() => {
    const level1 = options.filter((c) => c.parent === null && c.code !== 'kita');
    return level1.map((root) => ({
      root,
      children: options
        .filter((c) => c.parent === root.id)
        .sort((a, b) => a.sort - b.sort)
        .map((level2) => ({
          ...level2,
          leaves: options.filter((c) => c.parent === level2.id).sort((a, b) => a.sort - b.sort),
        })),
    }));
  }, [options]);

  const toggleExpand = (id: number) => {
    setExpandedLevel2((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isLevel2FullyCovered = (level2: { id: number; leaves: Category[] }) =>
    valueSet.has(level2.id) ||
    (level2.leaves.length > 0 && level2.leaves.every((l) => valueSet.has(l.id)));

  const isLevel2PartiallyCovered = (level2: { id: number; leaves: Category[] }) => {
    if (valueSet.has(level2.id)) return false;
    if (level2.leaves.length === 0) return false;
    const selectedCount = level2.leaves.filter((l) => valueSet.has(l.id)).length;
    return selectedCount > 0 && selectedCount < level2.leaves.length;
  };

  const effectiveLeafCount = (level2: { id: number; leaves: Category[] }) =>
    valueSet.has(level2.id)
      ? level2.leaves.length
      : level2.leaves.filter((l) => valueSet.has(l.id)).length;

  const toggleLevel2 = (level2: { id: number; leaves: Category[] }) => {
    const leafIdSet = new Set(level2.leaves.map((l) => l.id));
    if (isLevel2FullyCovered(level2)) {
      // Turn off: drop parent id and any leaf ids that were explicitly selected.
      onChange(value.filter((v) => v !== level2.id && !leafIdSet.has(v)));
    } else {
      // Consolidate to parent: drop any leaf ids, add the level-2 id.
      const next = value.filter((v) => !leafIdSet.has(v));
      next.push(level2.id);
      onChange(next);
    }
  };

  const toggleLeaf = (leaf: Category, level2: { id: number; leaves: Category[] }) => {
    if (valueSet.has(level2.id)) return; // locked while parent covers everything
    if (valueSet.has(leaf.id)) {
      onChange(value.filter((v) => v !== leaf.id));
    } else {
      const next = [...value, leaf.id];
      // Auto-consolidate: if every sibling is now in value, swap the leaf
      // ids for the parent id so the stored selection stays clean.
      const allSelected = level2.leaves.every((l) => next.includes(l.id));
      if (allSelected) {
        const leafIdSet = new Set(level2.leaves.map((l) => l.id));
        const consolidated = next.filter((v) => !leafIdSet.has(v));
        consolidated.push(level2.id);
        onChange(consolidated);
      } else {
        onChange(next);
      }
    }
  };

  const toggleGroup = (
    children: Array<{ id: number; leaves: Category[] }>,
    fullyCovered: boolean,
  ) => {
    if (fullyCovered) {
      // Atžymėti visus: drop every id (parent or leaf) under this group.
      const idsToDrop = new Set<number>();
      for (const c of children) {
        idsToDrop.add(c.id);
        c.leaves.forEach((l) => idsToDrop.add(l.id));
      }
      onChange(value.filter((v) => !idsToDrop.has(v)));
    } else {
      // Pasirinkti visus: drop any leaves under this group, add every level-2 id.
      const leafIdsToDrop = new Set<number>();
      for (const c of children) c.leaves.forEach((l) => leafIdsToDrop.add(l.id));
      const next = value.filter((v) => !leafIdsToDrop.has(v));
      for (const c of children) {
        if (!next.includes(c.id)) next.push(c.id);
      }
      onChange(next);
    }
  };

  return (
    <Container>
      {groups.map(({ root, children }) => {
        const groupFullyCovered =
          children.length > 0 && children.every((c) => isLevel2FullyCovered(c));
        const expandedChildren = children.filter((c) => expandedLevel2.has(c.id));
        return (
          <Group key={root.id}>
            <GroupHeaderRow>
              <GroupHeader>{root.name}</GroupHeader>
              <SelectAll onClick={() => toggleGroup(children, groupFullyCovered)}>
                {groupFullyCovered ? 'Atžymėti visus' : 'Pasirinkti visus'}
              </SelectAll>
            </GroupHeaderRow>
            <ChipsRow>
              {children.map((level2) => {
                const fullyCovered = isLevel2FullyCovered(level2);
                const partial = isLevel2PartiallyCovered(level2);
                const effective = effectiveLeafCount(level2);
                const expanded = expandedLevel2.has(level2.id);
                return (
                  <ChipGroup key={level2.id}>
                    <Chip
                      $selected={fullyCovered}
                      $partial={partial}
                      onClick={() => toggleLevel2(level2)}
                    >
                      {level2.name}
                      {(partial || (fullyCovered && level2.leaves.length > 0)) && (
                        <CountBadge $partial={partial}>
                          {effective}/{level2.leaves.length}
                        </CountBadge>
                      )}
                    </Chip>
                    {level2.leaves.length > 0 && (
                      <ExpandButton
                        type="button"
                        $expanded={expanded}
                        onClick={() => toggleExpand(level2.id)}
                        aria-label={expanded ? 'Suskleisti' : 'Išskleisti'}
                      >
                        <ChevronIcon name={IconName.dropdownArrow} />
                      </ExpandButton>
                    )}
                  </ChipGroup>
                );
              })}
            </ChipsRow>
            {expandedChildren.map((level2) => {
              const parentSelected = valueSet.has(level2.id);
              return (
                <ExpansionPanel key={`exp-${level2.id}`}>
                  <ExpansionHeader>{level2.name} pakategorės</ExpansionHeader>
                  <LeafRow>
                    {level2.leaves.map((leaf) => {
                      const leafSelected = parentSelected || valueSet.has(leaf.id);
                      return (
                        <LeafChip
                          key={leaf.id}
                          $selected={leafSelected}
                          $locked={parentSelected}
                          onClick={() => toggleLeaf(leaf, level2)}
                          title={
                            parentSelected
                              ? 'Atžymėkite tėvinę kategoriją norėdami keisti'
                              : undefined
                          }
                        >
                          {leaf.name}
                        </LeafChip>
                      );
                    })}
                  </LeafRow>
                </ExpansionPanel>
              );
            })}
          </Group>
        );
      })}
    </Container>
  );
};

export default Categories;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 8px;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const GroupHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const GroupHeader = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #333;
`;

const SelectAll = styled.a`
  color: #1f5c2e;
  text-decoration: underline;
  font-weight: 600;
  cursor: pointer;
  font-size: 12px;
`;

const ChipsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const ChipGroup = styled.div`
  display: inline-flex;
  align-items: center;
`;

const Chip = styled.div<{ $selected: boolean; $partial: boolean }>`
  padding: 8px 14px;
  border-top-left-radius: 16px;
  border-bottom-left-radius: 16px;
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
  border: 1px solid ${({ $selected, $partial }) => ($selected || $partial ? '#1b4c28' : '#d4d5de')};
  background-color: ${({ $selected, $partial }) =>
    $selected ? '#1b4c28' : $partial ? '#f4fdf6' : 'white'};
  color: ${({ $selected, $partial }) => ($selected ? 'white' : $partial ? '#1b4c28' : '#525252')};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    border-color: #1b4c28;
  }
`;

const CountBadge = styled.span<{ $partial: boolean }>`
  font-size: 11px;
  font-weight: 600;
  color: ${({ $partial }) => ($partial ? '#1b4c28' : 'white')};
  background: ${({ $partial }) => ($partial ? '#e8f5ec' : 'rgba(255, 255, 255, 0.2)')};
  padding: 1px 6px;
  border-radius: 8px;
`;

const ExpandButton = styled.button<{ $expanded: boolean }>`
  background: transparent;
  border: 1px solid #d4d5de;
  border-left: none;
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  width: 28px;
  height: 32px;
  padding: 0;
  margin-left: -1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #525252;
  background: white;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
  transform: ${({ $expanded }) => ($expanded ? 'rotate(180deg)' : 'rotate(0deg)')};

  &:hover {
    border-color: #1b4c28;
    color: #1b4c28;
  }
`;

const ChevronIcon = styled(Icon)`
  font-size: 1.2rem;
`;

const ExpansionPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #ececec;
`;

const ExpansionHeader = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #555;
`;

const LeafRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const LeafChip = styled.div<{ $selected: boolean; $locked: boolean }>`
  padding: 5px 10px;
  border-radius: 12px;
  border: 1px solid ${({ $selected }) => ($selected ? '#1b4c28' : '#e5e7eb')};
  background-color: ${({ $selected }) => ($selected ? '#f4fdf6' : 'white')};
  color: ${({ $selected }) => ($selected ? '#1b4c28' : '#666')};
  opacity: ${({ $locked }) => ($locked ? 0.7 : 1)};
  cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
  font-size: 12px;
  font-weight: 500;
  user-select: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ $locked }) => ($locked ? '#e5e7eb' : '#1b4c28')};
  }
`;
