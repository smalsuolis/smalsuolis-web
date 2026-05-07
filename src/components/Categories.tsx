import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Category } from '../utils';
import Icon from './Icons';
import { IconName } from '../utils';

// Hierarchical multi-select for statyba categories.
//
// Layout:
//   - Level-2 chips flow horizontally in a wrap row, grouped under their
//     level-1 parent (Pastatai / Inžineriniai). Each chip has a tiny
//     chevron icon-button next to it; click it to expand a sub-panel
//     listing the level-3 leaves. Multiple expansions stack.
//
// Selection model:
//   - `value` is a flat number[] of explicitly-selected ids at any level.
//   - Server-side `categoryGroup` walks descendants — so picking 'Gyvenamieji'
//     transparently covers its 6 leaves; picking only 'Daugiabutis' matches
//     just that leaf.
//
// Coverage display (what looks "selected" on screen):
//   - Level-2 is FULLY covered if its id is in value OR every one of its
//     leaves is in value → solid selected style.
//   - Level-2 is PARTIAL if some (not all) leaves are in value and the
//     parent isn't → light tint with "(N/M)" badge.
//   - Leaf chip looks selected if its id is in value OR its parent is in
//     value (covered transitively).
//
// Click behavior — must be undoable at any level:
//   - Click level-2 (covered)  → drop parent + all its leaves from value.
//   - Click level-2 (off/part) → consolidate: drop leaf entries under it,
//     add the level-2 id. (Functionally identical to "all leaves" but
//     cleaner state.)
//   - Click leaf when parent IS in value → drill-down: drop the parent,
//     add every sibling EXCEPT this one. So the user can deselect a single
//     leaf even after selecting the whole subtree.
//   - Click leaf normally → toggle the leaf id in value.
//
// No auto-consolidation on the leaf path — selecting all 6 leaves manually
// keeps them as 6 ids in value, so user can deselect any one of them
// individually. Level-2 chip still shows "fully covered" via the
// all-leaves check.
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
      onChange(value.filter((v) => v !== level2.id && !leafIdSet.has(v)));
    } else {
      const next = value.filter((v) => !leafIdSet.has(v));
      next.push(level2.id);
      onChange(next);
    }
  };

  const toggleLeaf = (leaf: Category, level2: { id: number; leaves: Category[] }) => {
    if (valueSet.has(leaf.id)) {
      // Direct deselect — leaf is explicitly selected, just drop it.
      onChange(value.filter((v) => v !== leaf.id));
      return;
    }
    if (valueSet.has(level2.id)) {
      // Parent covers this leaf transitively — user wants to remove just
      // this one. Replace the parent with the rest of its siblings.
      const siblings = level2.leaves.filter((l) => l.id !== leaf.id).map((l) => l.id);
      const next = value.filter((v) => v !== level2.id);
      onChange([...next, ...siblings]);
      return;
    }
    // Plain add.
    onChange([...value, leaf.id]);
  };

  const toggleGroup = (
    children: Array<{ id: number; leaves: Category[] }>,
    fullyCovered: boolean,
  ) => {
    if (fullyCovered) {
      const idsToDrop = new Set<number>();
      for (const c of children) {
        idsToDrop.add(c.id);
        c.leaves.forEach((l) => idsToDrop.add(l.id));
      }
      onChange(value.filter((v) => !idsToDrop.has(v)));
    } else {
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
                      {partial && (
                        <CountBadge>
                          {effective}/{level2.leaves.length}
                        </CountBadge>
                      )}
                    </Chip>
                    {level2.leaves.length > 0 && (
                      <ExpandButton
                        type="button"
                        onClick={() => toggleExpand(level2.id)}
                        aria-label={expanded ? 'Suskleisti' : 'Išskleisti'}
                      >
                        <ChevronWrapper $expanded={expanded}>
                          <Icon name={IconName.dropdownArrow} />
                        </ChevronWrapper>
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
                          onClick={() => toggleLeaf(leaf, level2)}
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
  gap: 8px;
`;

const ChipGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
`;

const Chip = styled.div<{ $selected: boolean; $partial: boolean }>`
  padding: 8px 14px;
  border-radius: 16px;
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

const CountBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #1b4c28;
  background: #e8f5ec;
  padding: 1px 6px;
  border-radius: 8px;
`;

const ExpandButton = styled.button`
  background: transparent;
  border: none;
  padding: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #888;
  border-radius: 50%;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: #f0f0f0;
    color: #1b4c28;
  }
`;

const ChevronWrapper = styled.span<{ $expanded: boolean }>`
  display: inline-flex;
  font-size: 1.1rem;
  line-height: 1;
  transform: ${({ $expanded }) => ($expanded ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.15s ease;
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

const LeafChip = styled.div<{ $selected: boolean }>`
  padding: 5px 10px;
  border-radius: 12px;
  border: 1px solid ${({ $selected }) => ($selected ? '#1b4c28' : '#e5e7eb')};
  background-color: ${({ $selected }) => ($selected ? '#f4fdf6' : 'white')};
  color: ${({ $selected }) => ($selected ? '#1b4c28' : '#666')};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: #1b4c28;
  }
`;
