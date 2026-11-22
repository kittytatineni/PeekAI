"""Deterministic response contract graders. Not a semantic-quality judgement."""
import math

def valid_question(q, kind):
    if not isinstance(q, dict) or q.get('type') != kind or not isinstance(q.get('prompt'), str) or not q['prompt'].strip():
        return False
    if kind == 'mcq':
        return (isinstance(q.get('options'), list) and len(q['options']) == 4
                and all(isinstance(o, str) and o.strip() for o in q['options'])
                and type(q.get('answer_index')) is int and 0 <= q['answer_index'] < 4)
    if kind == 'written':
        return (q.get('options') == [] and q.get('answer_index') is None
                and isinstance(q.get('ideal_answer'), str) and bool(q['ideal_answer'].strip()))
    return False

def valid_mark(r):
    if not isinstance(r, dict): return False
    score = r.get('score')
    if isinstance(score, bool) or not isinstance(score, (int,float)) or not math.isfinite(score) or not 0 <= score <= 1: return False
    if not isinstance(r.get('feedback'),str) or not r['feedback'].strip(): return False
    return all(isinstance(r.get(key,[]),list) for key in ('strengths','improvements'))

def classification_metrics(rows):
    total=len(rows)
    return {'correct':sum(x['pass'] for x in rows),'total':total,'accuracy':sum(x['pass'] for x in rows)/total if total else None}
