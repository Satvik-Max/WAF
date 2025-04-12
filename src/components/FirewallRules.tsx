
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttackType, FirewallRule } from '@/services/wafService';
import { cn } from '@/lib/utils';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import wafService from '@/services/wafService';

interface FirewallRulesProps {
  rules: FirewallRule[];
}

const FirewallRules = ({ rules: initialRules }: FirewallRulesProps) => {
  const [rules, setRules] = useState<FirewallRule[]>(initialRules);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  
  const [formValues, setFormValues] = useState({
    name: '',
    pattern: '',
    type: AttackType.OTHER,
    action: 'block' as 'block' | 'allow' | 'flag',
    enabled: true
  });
  
  const handleToggleRule = (id: string, enabled: boolean) => {
    const updatedRule = wafService.updateRule(id, { enabled });
    if (updatedRule) {
      setRules(rules.map(rule => rule.id === id ? updatedRule : rule));
    }
  };
  
  const handleEditRule = (rule: FirewallRule) => {
    setEditingRule(rule);
    setFormValues({
      name: rule.name,
      pattern: rule.pattern,
      type: rule.type,
      action: rule.action,
      enabled: rule.enabled
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteRule = (id: string) => {
    if (wafService.deleteRule(id)) {
      setRules(rules.filter(rule => rule.id !== id));
    }
  };
  
  const handleAddOrUpdateRule = () => {
    if (editingRule) {
      const updatedRule = wafService.updateRule(editingRule.id, formValues);
      if (updatedRule) {
        setRules(rules.map(rule => rule.id === editingRule.id ? updatedRule : rule));
      }
    } else {
      const newRule = wafService.addRule(formValues);
      setRules([...rules, newRule]);
    }
    
    handleCloseDialog();
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
    setFormValues({
      name: '',
      pattern: '',
      type: AttackType.OTHER,
      action: 'block',
      enabled: true
    });
  };
  
  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'block':
        return 'bg-waf-danger text-white';
      case 'allow':
        return 'bg-waf-success text-white';
      case 'flag':
        return 'bg-waf-warning text-black';
      default:
        return 'bg-waf-muted';
    }
  };

  return (
    <Card className="waf-card col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Firewall Rules</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                setEditingRule(null);
                setFormValues({
                  name: '',
                  pattern: '',
                  type: AttackType.OTHER,
                  action: 'block',
                  enabled: true
                });
              }}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Rule</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-waf-bg">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Rule' : 'Add New Rule'}</DialogTitle>
              <DialogDescription>
                {editingRule ? 'Modify the existing rule' : 'Create a new firewall rule to protect your application'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  className="col-span-3 bg-waf-card border-zinc-700"
                  value={formValues.name}
                  onChange={e => setFormValues({...formValues, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pattern" className="text-right">
                  Pattern
                </Label>
                <Input
                  id="pattern"
                  className="col-span-3 bg-waf-card border-zinc-700 font-mono"
                  placeholder="Regular expression pattern"
                  value={formValues.pattern}
                  onChange={e => setFormValues({...formValues, pattern: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select 
                  onValueChange={(val) => setFormValues({...formValues, type: val as AttackType})}
                  defaultValue={formValues.type}
                >
                  <SelectTrigger className="col-span-3 bg-waf-card border-zinc-700">
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent className="bg-waf-card border-zinc-700">
                    {Object.values(AttackType).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="action" className="text-right">
                  Action
                </Label>
                <Select 
                  onValueChange={(val) => setFormValues({...formValues, action: val as 'block' | 'allow' | 'flag'})}
                  defaultValue={formValues.action}
                >
                  <SelectTrigger className="col-span-3 bg-waf-card border-zinc-700">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent className="bg-waf-card border-zinc-700">
                    <SelectItem value="block">Block Request</SelectItem>
                    <SelectItem value="allow">Allow Request</SelectItem>
                    <SelectItem value="flag">Flag for Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="enabled" className="text-right">
                  Enabled
                </Label>
                <div className="col-span-3">
                  <Switch
                    id="enabled"
                    checked={formValues.enabled}
                    onCheckedChange={(checked) => setFormValues({...formValues, enabled: checked})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleAddOrUpdateRule}>
                {editingRule ? 'Update' : 'Add'} Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="w-[100px] text-right">Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id} className="hover:bg-waf-bg/20">
                <TableCell>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                    className="data-[state=checked]:bg-waf-accent"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div>{rule.name}</div>
                  {rule.pattern && (
                    <div className="text-xs text-waf-muted font-mono truncate max-w-[200px]">
                      {rule.pattern}
                    </div>
                  )}
                </TableCell>
                <TableCell>{rule.type}</TableCell>
                <TableCell>
                  <div className={cn(
                    "inline-block px-2 py-1 rounded-full text-xs",
                    getActionBadgeClass(rule.action)
                  )}>
                    {rule.action.toUpperCase()}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditRule(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default FirewallRules;
