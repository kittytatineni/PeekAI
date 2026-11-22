"""Offline reproducible schema/contract evaluation. Does not invoke paid LLM APIs."""
import argparse, json, sys
from datetime import datetime, timezone
from pathlib import Path
from graders import valid_question, valid_mark, classification_metrics
ROOT=Path(__file__).resolve().parent

def evaluate(dataset):
    rows=[]
    for c in dataset['quiz_cases']:
        actual=valid_question(c['response'],c['expected_kind'])
        rows.append({'id':c['id'],'group':'quiz','expected':c['expected_valid'],'actual':actual,'pass':actual == c['expected_valid']})
    for c in dataset['mark_cases']:
        actual=valid_mark(c['response'])
        rows.append({'id':c['id'],'group':'mark','expected':c['expected_valid'],'actual':actual,'pass':actual == c['expected_valid']})
    return {'dataset_id':dataset['dataset_id'],'dataset_origin':dataset['origin'],
            'metric':'agreement with hand-labelled validity on synthetic responses',
            'results':{group:classification_metrics([r for r in rows if r['group']==group]) for group in ('quiz','mark')},
            'overall':classification_metrics(rows),'cases':rows,
            'limitations':'Contract-validator tests only. No live model calls, semantic correctness, grading agreement, or syllabus extraction accuracy measured.'}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--dataset',default=str(ROOT/'datasets/held_out/response_validation.json'))
    parser.add_argument('--output',default=str(ROOT/'results/validation-latest.json'));args=parser.parse_args()
    data=json.loads(Path(args.dataset).read_text(encoding='utf-8'))
    report=evaluate(data);report['run_at_utc']=datetime.now(timezone.utc).isoformat()
    out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print('Offline validation:',report['overall']['correct'],'/',report['overall']['total'],'correct; output:',out)
    return 0 if report['overall']['correct']==report['overall']['total'] else 1
if __name__=='__main__':sys.exit(main())
