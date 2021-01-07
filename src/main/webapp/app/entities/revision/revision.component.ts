import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService, EventManager, JhiLanguageService, ParseLinks } from 'ng-jhipster';
import { Subscription } from 'rxjs/Rx';
import { ITEMS_PER_PAGE } from '../../shared';

import { Revision } from './revision.model';
import { RevisionService } from './revision.service';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { PagingParams } from '../../shared/commons';

@Component({
    selector: 'jhi-revisions',
    templateUrl: './revision.component.html',
})
export class RevisionComponent implements OnInit, OnDestroy {

    eventSubscriber: Subscription;
    revisions: Revision[];
    error: any;
    success: any;
    links: any;
    totalItems: any;
    queryCount: any;
    itemsPerPage: any;
    page: any;
    predicate: any;
    previousPage: any;
    ascending: any;
    routeData: any;

    constructor(
            private jhiLanguageService: JhiLanguageService,
            private revisionService: RevisionService,
            private parseLinks: ParseLinks,
            private alertService: AlertService,
            private activatedRoute: ActivatedRoute,
            private eventManager: EventManager,
            private router: Router,
    ) {
        this.itemsPerPage = ITEMS_PER_PAGE;
        const pagingParams$ = this.activatedRoute.data.map<any, PagingParams>(data => {
            const fallback = { page: 1, predicate: 'id', ascending: true };
            return data['pagingParams'] || fallback;
        });
        this.routeData = pagingParams$.subscribe(params => {
            this.page = params.page;
            this.previousPage = params.page;
            this.ascending = params.ascending;
            this.predicate = params.predicate;
        });
        this.jhiLanguageService.setLocations(['audits']);
    }

    ngOnInit() {
        this.loadAll();
        this.registerChangeInRevisions();
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.eventSubscriber);
        this.routeData.unsubscribe();
    }

    registerChangeInRevisions() {
        this.eventSubscriber = this.eventManager.subscribe('revisionListModification', (response) => this.loadAll());
    }

    loadAll() {
        this.revisionService.query({
            page: this.page - 1,
            size: this.itemsPerPage,
            sort: this.sort(),
        }).subscribe(
                (res: HttpResponse<any>) => this.onSuccess(res.body, res.headers),
                (res: HttpErrorResponse) => this.onError(res.message),
        );
    }

    trackIdentity(index, item: Revision) {
        return item.id;
    }

    sort() {
        const result = [this.predicate + ',' + (this.ascending ? 'asc' : 'desc')];
        if (this.predicate !== 'id') {
            result.push('id');
        }
        return result;
    }

    loadPage(page: number) {
        if (page !== this.previousPage) {
            this.previousPage = page;
            this.transition();
        }
    }

    transition() {
        this.router.navigate(['/revisions'], {
            queryParams:
                    {
                        page: this.page,
                        sort: this.predicate + ',' + (this.ascending ? 'asc' : 'desc'),
                    },
        });
        this.loadAll();
    }

    private onSuccess(data, headers) {
        this.links = this.parseLinks.parse(headers.get('link'));
        this.totalItems = headers.get('X-Total-Count');
        this.queryCount = this.totalItems;
        this.revisions = data;
    }

    private onError(error) {
        this.alertService.error(error.error, error.message, null);
    }
}
