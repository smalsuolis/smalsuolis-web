import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Category, IconName } from '../../utils';
import { font } from '../../styles';
import Icon from '../Icons';

// Recursive nested checkbox tree for the "Filtravimas pagal sritis" modal.
//
// Rules (per the redesign):
//  - Any node WITH children shows a chevron and is expandable, independent of
//    its checked state. A node WITHOUT children (leaf) has no chevron.
//  - A node's checkbox toggles the WHOLE subtree under it (select/deselect all
//    descendants). There is no separate "select all" link.
//  - Three states: empty (none selected), dash (some descendants selected), full
//    check (all selected).
//
// `value` is a flat number[] of selected leaf ids; parents derive their state
// from their leaves. Emitting leaf ids keeps the server-side categoryGroup
// filter unambiguous (it expands descendants anyway).

interface TreeNode extends Category {
  children: TreeNode[];
}

interface Props {
  options: Category[];
  value: number[];
  onChange: (ids: number[]) => void;
}

// All leaf ids under a node (a leaf's own id if it has no children).
const leafIdsOf = (node: TreeNode): number[] =>
  node.children.length === 0 ? [node.id] : node.children.flatMap(leafIdsOf);

const CategoryTree = ({ options, value, onChange }: Props) => {
  const valueSet = useMemo(() => new Set(value), [value]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Build the forest. The depth-0 roots ("Pastatai", "Inžineriniai statiniai")
  // are containers only — we surface their children as the top rows, skipping
  // the "kita/nepriskirta" branch.
  const topNodes = useMemo(() => {
    const build = (parentId: number | null): TreeNode[] =>
      options
        .filter((c) => c.parent === parentId && c.code !== 'kita' && !c.hidden)
        .sort((a, b) => a.sort - b.sort)
        .map((c) => ({ ...c, children: build(c.id) }));

    const roots = build(null);
    return roots.flatMap((r) => r.children);
  }, [options]);

  const toggleExpand = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Selection state of a node from its leaves: 'none' | 'partial' | 'all'.
  const stateOf = (node: TreeNode): 'none' | 'partial' | 'all' => {
    const leaves = leafIdsOf(node);
    const selected = leaves.filter((id) => valueSet.has(id)).length;
    if (selected === 0) return 'none';
    if (selected === leaves.length) return 'all';
    return 'partial';
  };

  // Toggle a node = select/deselect all its leaves.
  const toggleNode = (node: TreeNode) => {
    const leaves = leafIdsOf(node);
    const leafSet = new Set(leaves);
    const state = stateOf(node);
    if (state === 'all') {
      onChange(value.filter((v) => !leafSet.has(v)));
    } else {
      onChange([...value.filter((v) => !leafSet.has(v)), ...leaves]);
    }
  };

  const renderNode = (node: TreeNode, depth: number) => {
    const state = stateOf(node);
    const hasChildren = node.children.length > 0;
    const isOpen = expanded.has(node.id);
    return (
      <Node key={node.id}>
        <Row $depth={depth}>
          <CheckBox
            $state={state}
            onClick={() => toggleNode(node)}
            role="checkbox"
            aria-checked={state === 'partial' ? 'mixed' : state === 'all'}
          >
            {state === 'all' && <Check />}
            {state === 'partial' && <Dash />}
          </CheckBox>
          <RowLabel onClick={() => toggleNode(node)}>{node.name}</RowLabel>
          {hasChildren && (
            <ExpandBtn onClick={() => toggleExpand(node.id)} aria-label="Išskleisti">
              <Chevron name={IconName.dropdownArrow} $open={isOpen} />
            </ExpandBtn>
          )}
        </Row>
        {hasChildren && isOpen && (
          <Children>{node.children.map((child) => renderNode(child, depth + 1))}</Children>
        )}
      </Node>
    );
  };

  return <Wrap>{topNodes.map((n) => renderNode(n, 0))}</Wrap>;
};

export default CategoryTree;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 0;
`;

const Node = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div<{ $depth: number }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  padding-left: ${({ $depth }) => 4 + $depth * 30}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[300]};
`;

const RowLabel = styled.span`
  ${font('base', 500)};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  flex: 1;
`;

const ExpandBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  background: transparent;
  flex-shrink: 0;
`;

const Chevron = styled(Icon)<{ $open: boolean }>`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.grey[600]};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.15s ease;
`;

const Children = styled.div`
  display: flex;
  flex-direction: column;
`;

const CheckBox = styled.span<{ $state: 'none' | 'partial' | 'all' }>`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid
    ${({ $state, theme }) => ($state === 'none' ? theme.colors.grey[500] : theme.colors.primary)};
  background: ${({ $state, theme }) => ($state === 'none' ? 'transparent' : theme.colors.primary)};
`;

// Indeterminate mark for partially-selected nodes.
const Dash = styled.span`
  width: 10px;
  height: 2px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.text.primary};
`;

// CSS-drawn checkmark with a 2px stroke to match the Dash weight.
const Check = styled.span`
  width: 6px;
  height: 11px;
  margin-top: -2px;
  border: solid ${({ theme }) => theme.colors.text.primary};
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
`;
