import * as ts from 'typescript';
import * as Lint from 'tslint';

import { AstUtils } from './utils/AstUtils';
import { ChaiUtils } from './utils/ChaiUtils';
import { ExtendedMetadata } from './utils/ExtendedMetadata';

const FAILURE_STRING: string = 'Found chai call with indexOf that can be converted to .contain assertion: ';

export class Rule extends Lint.Rules.AbstractRule {
    public static metadata: ExtendedMetadata = {
        ruleName: 'chai-prefer-contains-to-index-of',
        type: 'maintainability',
        description: 'Avoid Chai assertions that invoke indexOf and compare for a -1 result.',
        options: null, // tslint:disable-line:no-null-keyword
        optionsDescription: '',
        typescriptOnly: true,
        issueClass: 'Non-SDL',
        issueType: 'Warning',
        severity: 'Important',
        level: 'Opportunity for Excellence',
        group: 'Clarity',
        commonWeaknessEnumeration: '398, 710'
    };

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new ChaiPreferContainsToIndexOfRuleWalker(sourceFile, this.getOptions()));
    }
}

class ChaiPreferContainsToIndexOfRuleWalker extends Lint.RuleWalker {
    protected visitCallExpression(node: ts.CallExpression): void {
        if (ChaiUtils.isExpectInvocation(node)) {
            if (this.isFirstArgumentIndexOfResult(node)) {
                if (node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
                    if (ChaiUtils.isEqualsInvocation(<ts.PropertyAccessExpression>node.expression)) {
                        if (this.isFirstArgumentNegative1(node)) {
                            this.addFailureAt(node.getStart(), node.getWidth(), FAILURE_STRING);
                        }
                    }
                }
            }
        }
        super.visitCallExpression(node);
    }

    private isFirstArgumentNegative1(node: ts.CallExpression): boolean {
        if (node.arguments !== undefined && node.arguments.length > 0) {
            const firstArgument: ts.Expression = node.arguments[0];
            if (firstArgument.getText() === '-1') {
                return true;
            }
        }
        return false;
    }

    private isFirstArgumentIndexOfResult(node: ts.CallExpression): boolean {
        const expectCall = ChaiUtils.getLeftMostCallExpression(node);
        if (expectCall !== undefined && expectCall.arguments !== undefined && expectCall.arguments.length > 0) {
            const firstArgument: ts.Expression = expectCall.arguments[0];
            if (firstArgument.kind === ts.SyntaxKind.CallExpression) {
                if (AstUtils.getFunctionName(<ts.CallExpression>firstArgument) === 'indexOf') {
                    return true;
                }
            }
        }
        return false;
    }
}
