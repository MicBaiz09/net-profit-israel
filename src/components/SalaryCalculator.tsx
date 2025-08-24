import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Users, Shield, DollarSign, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateSalary, formatCurrency, type CalculationInput, type Child } from '@/lib/tax-calculator';

export function SalaryCalculator() {
  const [input, setInput] = useState<CalculationInput>({
    gross_monthly: 15000,
    is_resident: true,
    gender: 'male',
    age: 30,
    children: [],
    single_parent: false,
    new_immigrant: false,
    returning_resident: false,
    manual_credit_points: 0,
    months_worked_in_year: 12,
  });

  const [newChildAge, setNewChildAge] = useState<string>('');

  const result = useMemo(() => calculateSalary(input), [input]);

  const updateInput = (updates: Partial<CalculationInput>) => {
    setInput(prev => ({ ...prev, ...updates }));
  };

  const addChild = () => {
    const age = parseInt(newChildAge);
    if (age >= 0 && age <= 30) {
      updateInput({ children: [...input.children, { age }] });
      setNewChildAge('');
    }
  };

  const removeChild = (index: number) => {
    const newChildren = input.children.filter((_, i) => i !== index);
    updateInput({ children: newChildren });
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-bg p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              מחשבון שכר מברוטו לנטו
            </h1>
            <p className="text-lg text-muted-foreground">
              חישוב מדויק של שכר נטו, מסים וביטוח לאומי לשנת 2025
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Input Panel */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    פרטים אישיים
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="gross">שכר ברוטו חודשי</Label>
                    <Input
                      id="gross"
                      type="number"
                      value={input.gross_monthly}
                      onChange={(e) => updateInput({ gross_monthly: parseInt(e.target.value) || 0 })}
                      className="text-lg font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>מין</Label>
                      <Select value={input.gender} onValueChange={(value: 'male' | 'female') => updateInput({ gender: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">זכר</SelectItem>
                          <SelectItem value="female">נקבה</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="age">גיל</Label>
                      <Input
                        id="age"
                        type="number"
                        value={input.age}
                        onChange={(e) => updateInput({ age: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="resident"
                      checked={input.is_resident}
                      onCheckedChange={(checked) => updateInput({ is_resident: !!checked })}
                    />
                    <Label htmlFor="resident">תושב ישראל</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="single_parent"
                      checked={input.single_parent}
                      onCheckedChange={(checked) => updateInput({ single_parent: !!checked })}
                    />
                    <Label htmlFor="single_parent">הורה יחיד</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="new_immigrant"
                      checked={input.new_immigrant}
                      onCheckedChange={(checked) => updateInput({ new_immigrant: !!checked })}
                    />
                    <Label htmlFor="new_immigrant">עולה חדש</Label>
                  </div>

                  <div>
                    <Label htmlFor="manual_credits">נקודות זיכוי נוספות</Label>
                    <Input
                      id="manual_credits"
                      type="number"
                      step="0.25"
                      min="0"
                      max="10"
                      value={input.manual_credit_points}
                      onChange={(e) => updateInput({ manual_credit_points: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    ילדים
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="גיל הילד"
                      type="number"
                      value={newChildAge}
                      onChange={(e) => setNewChildAge(e.target.value)}
                    />
                    <Button onClick={addChild} variant="outline" size="sm">
                      הוסף
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {input.children.map((child, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>ילד בן {child.age}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChild(index)}
                        >
                          הסר
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Result */}
              <Card className="shadow-strong bg-gradient-success text-white">
                <CardContent className="p-8">
                  <div className="text-center">
                    <p className="text-lg opacity-90 mb-2">הנטו המשוער שלך</p>
                    <p className="text-5xl font-bold mb-4">{formatCurrency(result.net)}</p>
                    <div className="flex justify-center gap-4 text-sm opacity-90">
                      <span>מתוך {formatCurrency(result.gross)} ברוטו</span>
                      <span>•</span>
                      <span>חיסכון של {formatCurrency(result.total_deductions)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="shadow-medium">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-4 w-4" />
                      מס הכנסה
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>מס הכנסה מחושב לפי מדרגות המס לשנת 2025</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">לפני זיכויים</span>
                      <span className="font-semibold">{formatCurrency(result.income_tax_before_credits)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">זיכויים ({result.credit_points.total} נק')</span>
                      <span className="font-semibold text-success">-{formatCurrency(result.credit_points.total_value)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>אחרי זיכויים</span>
                      <span>{formatCurrency(result.income_tax_after_credits)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-medium">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-4 w-4" />
                      ביטוח לאומי ובריאות
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ביטוח לאומי</span>
                      <span className="font-semibold">{formatCurrency(result.national_insurance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">מס בריאות</span>
                      <span className="font-semibold">{formatCurrency(result.health_tax)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>סה"כ ביטוח</span>
                      <span>{formatCurrency(result.national_insurance + result.health_tax)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-medium">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-4 w-4" />
                      עלות מעסיק
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{formatCurrency(result.employer_cost)}</p>
                      <p className="text-sm text-muted-foreground">כולל הפרשות מעסיק</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-medium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">נקודות זיכוי</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>אוטומטיות</span>
                      <Badge variant="outline">{result.credit_points.auto}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>ידניות</span>
                      <Badge variant="outline">{result.credit_points.manual}</Badge>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>סה"כ</span>
                      <Badge>{result.credit_points.total}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Legal Disclaimer */}
              <Card className="shadow-soft bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    <strong>הערה משפטית:</strong> המחשבון מיועד להערכה בלבד ואינו מהווה ייעוץ מס. 
                    יש לבדוק עם רו״ח או יועץ מס לקבלת מידע מדויק ועדכני.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}